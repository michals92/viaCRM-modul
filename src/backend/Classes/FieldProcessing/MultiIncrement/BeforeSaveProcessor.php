<?php

namespace Espo\Modules\Viacrm\Classes\FieldProcessing\MultiIncrement;

use Espo\Core\Exceptions\Error;
use Espo\Core\ORM\Entity;
use Espo\Core\ORM\EntityManager;
use Espo\Core\ORM\Repository\Option\SaveOption;
use Espo\Core\Utils\DateTime;
use Espo\Core\Utils\Metadata;
use Espo\Entities\NextNumber;
use Espo\Entities\User;

class BeforeSaveProcessor {
	public function __construct(
		private readonly Metadata $metadata,
		private readonly EntityManager $entityManager,
		private readonly User $user
	) {}

	/**
	 * @var array<string, string[]>
	 */
	private $fieldListMapCache = [];

	/**
	 * For an existing record.
	 * @throws Error
	 */
	public function processPopulate(Entity $entity, string $field): void {
		$fieldList = $this->getFieldList($entity->getEntityType());

		if (!in_array($field, $fieldList)) {
			throw new Error('Bad field.');
		}

		$this->processItem($entity, $field, [], true);
	}

	/**
	 * @param array<string, mixed> $options
	 */
	public function process(Entity $entity, array $options): void {
		$fieldList = $this->getFieldList($entity->getEntityType());

		foreach ($fieldList as $field) {
			$this->processItem($entity, $field, $options);
		}
	}

	/**
	 * @param array<string, mixed> $options
	 */
	private function processItem(Entity $entity, string $field, array $options, bool $populate = false): void {
		if (!empty($options[SaveOption::IMPORT])) {
			if ($entity->has($field)) {
				return;
			}
		}

		if (!$entity->isNew()) {
			if ($entity->isAttributeChanged($field)) {
				$entity->set($field, $entity->getFetched($field));
			}

			if (!$populate) {
				return;
			}
		}

		$sequences = $this->metadata->get(['entityDefs', $entity->getEntityType(), 'fields', $field, 'sequences'], []);

		foreach ($sequences as $i => $sequence) {
			if ($this->checkConditionGroupApplies($entity, $sequence['conditionGroup'])) {
				$this->processSequence($entity, $field, $sequence, $i);

				return;
			}
		}
	}

	/**
	 * @param array<string, mixed> $conditionGroup
	 */
	protected function checkConditionGroupApplies(Entity $entity, array $conditionGroup): bool {
		$type = $conditionGroup['type'] ?? 'and';

		$result = false;

		switch ($type) {
			case 'and':
				$list = $conditionGroup;

				// Empty 'and' counts as matchíng
				$result = true;

				foreach ($list as $condition) {
					$result = $result && $this->checkConditionApplies($entity, $condition);
				}
				break;
			case 'or':
				$list = $conditionGroup;

				foreach ($list as $condition) {
					$result = $result || $this->checkConditionApplies($entity, $condition);
				}
				break;
			case 'not':
				$result = !$this->checkConditionApplies($entity, $conditionGroup);
				break;
			default:
				throw new Error('Unknown condition group type.');
		}

		return $result;
	}

	/**
	 * @param array<string, mixed> $condition
	 */
	protected function checkConditionApplies(Entity $entity, array $condition): bool {
		$type = $condition['type'] ?? 'equals';

		switch ($type) {
			case 'or':
			case 'and':
			case 'not':
				return $this->checkConditionGroupApplies($entity, $condition);
		}

		$attribute = $condition['attribute'] ?? null;
		$value = $condition['value'] ?? null;

		if (!$attribute) {
			return false;
		}

		$setValue = $this->getAttributeValue($entity, $attribute);

		switch ($type) {
			case 'equals':
				return $value && $setValue === $value;
			case 'notEquals':
				$GLOBALS['log']->debug('conditionGroup', [$setValue, $value]);

				return $value && $setValue !== $value;
			case 'isEmpty':
				if (is_array($setValue)) {
					return empty($setValue);
				}

				return $setValue === null || $setValue === '';
			case 'isNotEmpty':
				if (is_array($setValue)) {
					return !empty($setValue);
				}

				return $setValue !== null && $setValue !== '';
			case 'isTrue':
				return (bool) $setValue;
			case 'isFalse':
				return !$setValue;
			case 'contains':
			case 'has':
				if (is_array($setValue)) {
					return !empty($setValue) && in_array($value, $setValue);
				}

				return $setValue && is_string($setValue) && strpos($setValue, $value) !== false;
			case 'notContains':
			case 'notHas':
				if (is_array($setValue)) {
					return empty($setValue) || !in_array($value, $setValue);
				}

				return !$setValue || !is_string($setValue) || strpos($setValue, $value) === false;
			case 'startsWith':
				return $setValue && strpos($setValue, $value) === 0;
			case 'endsWith':
				return $setValue && substr($setValue, -strlen($value)) === $value;
			case 'matches':
				if (!$setValue) {
					return false;
				}
				$match = [];
				if (preg_match('/^\/(.*)\/([a-z]*)$/', $value, $match)) {
					return (bool) preg_match('/' . $match[1] . '/' . $match[2], $setValue);
				}

				return false;
			case 'greaterThan':
				return $setValue > $value;
			case 'lessThan':
				return $setValue < $value;
			case 'greaterThanOrEquals':
				return $setValue >= $value;
			case 'lessThanOrEquals':
				return $setValue <= $value;
			case 'in':
				return in_array($setValue, $value);
			case 'notIn':
				return !in_array($setValue, $value);
			case 'isToday':
				if (strlen($setValue) > 10) {
					$format = DateTime::SYSTEM_DATE_TIME_FORMAT;
				} else {
					$format = DateTime::SYSTEM_DATE_FORMAT;
				}

				$givenDate = \DateTime::createFromFormat($format, $setValue);
				$today = new \DateTime(); // Defaults to 'now'

				return $givenDate && $givenDate->format('Y-m-d') === $today->format('Y-m-d');
			case 'inFuture':
				if (!$setValue) {
					return false;
				}

				$format = (strlen($setValue) > 10) ? DateTime::SYSTEM_DATE_TIME_FORMAT : DateTime::SYSTEM_DATE_FORMAT;
				$givenDate = \DateTime::createFromFormat($format, $setValue);
				$now = new \DateTime();

				return $givenDate && $givenDate > $now;
			case 'inPast':
				if (!$setValue) {
					return false;
				}

				$format = (strlen($setValue) > 10) ? DateTime::SYSTEM_DATE_TIME_FORMAT : DateTime::SYSTEM_DATE_FORMAT;
				$givenDate = \DateTime::createFromFormat($format, $setValue);
				$now = new DateTime();

				return $givenDate && $givenDate < $now;
			default:
				return false;
		}
	}

	protected function getAttributeValue(Entity $entity, string $attribute): mixed {
		if (str_starts_with($attribute, '$')) {
			if ($attribute === '$user.id') {
				return $this->user->getId();
			}

			if ($attribute === '$user.teamsIds') {
				return $this->user->getTeamIdList();
			}
		}

		return $entity->get($attribute);
	}

	/**
	 * @param array<string, mixed> $sequence
	 */
	protected function processSequence(Entity $entity, string $field, array $sequence, int $sequenceIndex): void {
		$em = $this->entityManager;
		$em->getTransactionManager()->start();

		$nextNumber = $em
			->getRDBRepository(NextNumber::ENTITY_TYPE)
			->where([
				'fieldName' => $field,
				'entityType' => $entity->getEntityType(),
				'sequence' => $sequenceIndex,
			])
			->forUpdate()
			->findOne();

		if (!$nextNumber) {
			$nextNumber = $em->getNewEntity(NextNumber::ENTITY_TYPE);

			$nextNumber->set([
				'entityType' => $entity->getEntityType(),
				'fieldName' => $field,
				'sequence' => $sequenceIndex,
			]);
		}

		$entity->set($field, $this->composeNumberAttribute($nextNumber, $sequence));

		$value = $nextNumber->get('value');

		if (!$value) {
			$value = 1;
		}

		$value++;

		$nextNumber->set('value', $value);

		$em->saveEntity($nextNumber);
		$em->getTransactionManager()->commit();
	}

	/**
	 * @param array<string, mixed> $sequence
	 */
	private function composeNumberAttribute(NextNumber $nextNumber, array $sequence): string {
		$value = $nextNumber->get('value');
		$padLength = $sequence['padLength'] ?? 0;

		$numberPart = str_pad(strval($value), $padLength, '0', STR_PAD_LEFT);

		$year = date('Y');
		$yearTwoDigits = date('y');
		$month = date('m');

		return str_replace(
			[
				'{number}',
				'{MM}',
				'{YYYY}',
				'{YY}'
			],
			[
				$numberPart,
				$month,
				$year,
				$yearTwoDigits
			],
			$sequence['format']
		);
	}

	/**
	 * @return string[]
	 */
	private function getFieldList(string $entityType): array {
		if (array_key_exists($entityType, $this->fieldListMapCache)) {
			return $this->fieldListMapCache[$entityType];
		}

		$entityDefs = $this->entityManager
			->getDefs()
			->getEntity($entityType);

		$list = [];

		foreach ($entityDefs->getFieldNameList() as $name) {
			$defs = $entityDefs->getField($name);

			if ($defs->getType() !== 'multiIncrement') {
				continue;
			}

			$list[] = $name;
		}

		$this->fieldListMapCache[$entityType] = $list;

		return $list;
	}
}
