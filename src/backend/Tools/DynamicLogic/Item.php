<?php

namespace Espo\Modules\Autocrm\Tools\DynamicLogic;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Json;
use Espo\Modules\Autocrm\Tools\DynamicLogic\Exceptions\BadCondition;
use Espo\ORM\Query\Part\Where\AndGroup;
use Espo\ORM\Query\Part\WhereClause;
use Espo\ORM\Query\Part\WhereItem as WhereClauseItem;
use Espo\ORM\Query\SelectBuilder as QueryBuilder;
use stdClass;

readonly class Item {

	const DEBUG_MODE = false;

	/**
	 * @param array<int, array<string, mixed>> $rawData
	 */
	public function __construct(
		protected array $rawData,
		public Type     $type,
		public mixed    $value,
		public ?string  $attribute = null,
		public ?string  $subjectType = null,
		public ?string  $field = null,
	) {}

	/**
	 * @param array<int, mixed> $args
	 */
	protected function debug(...$args): void {
		// @phpstan-ignore-next-line
		if (!self::DEBUG_MODE) {
			return;
		}
		// @phpstan-ignore-next-line
		$formatted = array_map(static function ($arg) {
			try {
				if (is_object($arg)) {
					return '(' . get_class($arg) . ')' . ': ' . JSON::encode($arg);
				}
				if (is_array($arg)) {
					return '(Array): ' . JSON::encode($arg);
				}
			} catch (\JsonException $e) {
				return $e->getMessage();
			}
			if (is_bool($arg)) {
				return '(Bool): ' . ($arg ? 'true' : 'false');
			}
			if (is_null($arg)) {
				return '(null)';
			}
			if (!is_string($arg)) {
				return '(' . gettype($arg) . '): ' . (string)$arg;
			}

			return $arg;
		}, $args);

		$GLOBALS['log']->debug('[Autocrm/DynamicLogic/Item] ' . implode(' ', $formatted));
	}

	/**
	 *
	 * @param  array<string, mixed> $options
	 * @throws \LogicException
	 * @throws BadRequest
	 * @throws \ReflectionException
	 * @todo: fix that when converting the item from raw version the comparator ">=" possibly becomes "="
	 * for example, dynamic logic amount >= 5000 becomes "AND (supplierInvoice.amount = 5000)"
	 * @todo: backport WhereConverterParams to espo 8.4.2
	 */
	public function toWhereItem(QueryBuilder $queryBuilder, array $options = []): WhereClauseItem {
		$this->debug('toWhereItem called with options', $options);

		if (!class_exists('Espo\Core\Select\Where\Converter\Params')) {
			$this->debug('Espo\Core\Select\Where\Converter\Params class not available');
			throw new \LogicException('Espo\Core\Select\Where\Converter\Params is not available. This class is usually available in EspoCRM >9.0.0');
		}

		if ($this->attribute) {
			$this->debug('Processing attribute-based condition', $this->attribute);
			/** @var InjectableFactory $injectableFactory */
			$injectableFactory = $options[Option::INJECTABLE_FACTORY] ?? throw new \LogicException('Injectable factory is not set.');
			$entityType = $queryBuilder->build()->getFrom();
			$this->debug('EntityType from query builder', $entityType);
			assert($entityType !== null, 'EntityType cannot be null when creating a where converter.');
			$conditionConverter = $injectableFactory->createWith(
				\Espo\Modules\Autocrm\Tools\DynamicLogic\ConverterFactory::class,
				['entityType' => $entityType],
			);
			$convertedConditions = [];
			foreach ($this->rawData as $index => $condition) {
				$this->debug('Converting condition at index', $index, $condition);
				$convertedCondition = $conditionConverter->apply($queryBuilder, $condition, $options);
				if ($convertedCondition === null) {
					$this->debug('Condition at index was converted to null, will be removed', $index);
					continue;
				}
				$convertedConditions[] = $convertedCondition;
			}
			$this->debug('Final processed conditions', $convertedConditions);

			return AndGroup::fromRaw($convertedConditions);
		}

		if (is_array($this->value)) {
			$this->debug('Processing array value condition');

			/** @var Item[] $items */
			$items = $this->value;
			$conditions = [];

			foreach ($items as $index => $item) {
				$this->debug('Processing sub-item at index', $index, $item);
				$conditions[] = $item->toWhereItem($queryBuilder, $options);
			}

			$result = WhereClause::create(...$conditions);
			$this->debug('Created WhereClause from conditions', $result->getRaw());

			return $result;
		}

		$this->debug('Unexpected item format encountered', $this);
		throw new \RuntimeException('Unexpected item format');
	}

	/**
	 * @param  stdClass[]   $rawItems
	 * @throws BadCondition
	 */
	public static function fromGroupDefinition(array|stdClass $rawItems): Item {
		if (!is_array($rawItems)) {
			$rawItems = (array)$rawItems;
		}

		if ($rawItems['conditionGroup']) {
			$rawItems = $rawItems['conditionGroup'];
		}

		return new Item(
			rawData: $rawItems,
			type: Type::And,
			value: array_map(static fn($it) => self::fromItemDefinition((object)$it), $rawItems),
		);
	}

	/**
	 * @throws BadCondition
	 */
	public static function fromItemDefinition(stdClass $rawItem): Item {
		$type = $rawItem->type ?? null;
		$attribute = $rawItem->attribute ?? null;
		$value = $rawItem->value ?? null;

		if (!$type || !is_string($type)) {
			throw new BadCondition('No type.');
		}

		if ($type === 'has') {
			$type = 'contains';
		}

		if ($type === Type::And->value || $type === Type::Or->value) {
			if (!is_array($value)) {
				throw new BadCondition('Non-array value.');
			}

			foreach ($value as $it) {
				if (!$it instanceof stdClass) {
					throw new BadCondition('Bad group item value.');
				}
			}

			return new Item(
				rawData: [(array)$rawItem],
				type: Type::from($type),
				value: array_map(static fn($it) => self::fromItemDefinition($it), $value),
			);
		}

		if ($type === Type::Not->value) {
			if (!$value instanceof stdClass) {
				throw new BadCondition('Bad not item value.');
			}

			return new Item(
				rawData: [(array)$rawItem],
				type: Type::from($type),
				value: self::fromItemDefinition($value),
			);
		}

		if ($attribute !== null && !is_string($attribute)) {
			throw new BadCondition('No attribute.');
		}
		$field = null;
		if (isset($rawItem->data->field)) {
			$field = $rawItem->data->field;
		} elseif (isset($rawItem->field)) {
			$field = $rawItem->field;
		}

		return new Item(
			rawData: [(array)$rawItem],
			type: Type::from($type),
			value: $value,
			attribute: $attribute,
			subjectType: $rawItem->subjectType ?? null,
			field: $field,
		);
	}

}
