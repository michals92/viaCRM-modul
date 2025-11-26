<?php

namespace Espo\Modules\Viacrm\Tools\DynamicLogic;

use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Metadata;
use Espo\Entities\User;
use Espo\ORM\Query\SelectBuilder as QueryBuilder;

class ConverterFactory
{
	public function __construct(
		protected InjectableFactory $injectableFactory,
		protected Metadata $metadata,
		protected string $entityType,
		protected \Espo\Core\Select\Where\ConverterFactory $converterFactory,
		protected User $loggedInUser
	) {
	}

	/**
	 * @param QueryBuilder              $queryBuilder
	 * @param array<string, mixed>|null $condition
	 * @param array<string, mixed>      $options
	 *
	 * @return array<string, mixed>|null
	 */
	public function apply(QueryBuilder $queryBuilder, null|array $condition, array $options): ?array
	{
		if ($condition === null) {
			return null;
		}
		if (!class_exists('\Espo\Core\Select\Where\Converter\Params')) {
			throw new \LogicException('ConverterParams class not found, they may usually be found in EspoCRM >9.0.0.');
		}
		if (!isset($options[Option::USER]) || !($options[Option::USER] instanceof \Espo\Entities\User)) {
			$options[Option::USER] = $this->loggedInUser;
		}

		$converterClassNameList = $this->getConverterClassNameList();
		$whereItemConverter = $this->converterFactory->create($this->entityType, $options[Option::USER]);
		$options[Option::WHERE_ITEM_CONVERTER] = $whereItemConverter;

		/**
		 * @phpstan-var \Espo\Core\Select\Where\Converter\Params $converterParamsValue
		 */
		$converterParamsValue = new \Espo\Core\Select\Where\Converter\Params(useSubQueryIfMany: true);
		$options[Option::CONVERTER_PARAMS] = $converterParamsValue;

		foreach ($converterClassNameList as $converterClassName) {
			$converter = $this->create($converterClassName);
			$convertedCondition = $converter->convert($queryBuilder, $condition, $options);
			if ($convertedCondition === null) {
				return null;
			}
			$condition = $convertedCondition;
		}

		return $condition;
	}

	/**
	 * @param class-string<ConditionConverter> $className
	 *
	 * @return ConditionConverter
	 */
	public function create(string $className): ConditionConverter
	{
		return $this->injectableFactory->create($className);
	}

	/**
	 * @return array<class-string<ConditionConverter>>
	 */
	private function getConverterClassNameList(): array
	{
		$classNameList = $this->metadata->get(['selectDefs', $this->entityType, 'conditionConverterClassNameList']);
		$suppressClassNameList = $this->metadata->get(['selectDefs', $this->entityType, 'conditionConverterSuppressClassNameList'], []);

		if ($classNameList) {
			$classNameList = [DefaultConditionConverter::class, ...$classNameList];
		} else {
			$classNameList = [DefaultConditionConverter::class];
		}

		return array_diff($classNameList, $suppressClassNameList);
	}
}
