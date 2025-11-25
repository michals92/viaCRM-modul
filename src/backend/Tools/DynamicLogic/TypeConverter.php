<?php

namespace Espo\Modules\Viacrm\Tools\DynamicLogic;

use Espo\Core\Select\Where\Item\Type as WhereType;
use Espo\Modules\Viacrm\Tools\DynamicLogic\Type as DynamicLogicType;

/**
 * Helper class to convert between Where\Item\Type and DynamicLogic\Type
 */
class TypeConverter {

	/**
	 * Mapping between Where\Item\Type constants and DynamicLogic\Type enum values
	 * @var array<string, string>
	 */
	private static array $typeMap = [
		WhereType::AND => DynamicLogicType::And->value,
		WhereType::OR => DynamicLogicType::Or->value,
		WhereType::NOT => DynamicLogicType::Not->value,
		WhereType::EQUALS => DynamicLogicType::Equals->value,
		WhereType::NOT_EQUALS => DynamicLogicType::NotEquals->value,
		WhereType::IS_LINKED_WITH => DynamicLogicType::Contains->value,
		WhereType::IS_NOT_LINKED_WITH => DynamicLogicType::NotContains->value,
		WhereType::STARTS_WITH => DynamicLogicType::StartsWith->value,
		WhereType::ENDS_WITH => DynamicLogicType::EndsWith->value,
		WhereType::GREATER_THAN => DynamicLogicType::GreaterThan->value,
		WhereType::LESS_THAN => DynamicLogicType::LessThan->value,
		WhereType::GREATER_THAN_OR_EQUALS => DynamicLogicType::GreaterThanOrEquals->value,
		WhereType::LESS_THAN_OR_EQUALS => DynamicLogicType::LessThanOrEquals->value,
		WhereType::IN => DynamicLogicType::In->value,
		WhereType::NOT_IN => DynamicLogicType::NotIn->value,
		WhereType::IS_NULL => DynamicLogicType::IsEmpty->value,
		WhereType::IS_NOT_NULL => DynamicLogicType::IsNotEmpty->value,
		WhereType::IS_TRUE => DynamicLogicType::IsTrue->value,
		WhereType::IS_FALSE => DynamicLogicType::IsFalse->value,
		WhereType::TODAY => DynamicLogicType::IsToday->value,
		WhereType::PAST => DynamicLogicType::InPast->value,
		WhereType::FUTURE => DynamicLogicType::InFuture->value,
		// Additional mappings could be added here
	];

	/**
	 * Convert Where\Item\Type to DynamicLogic\Type
	 *
	 * @param  string                $whereType The Where\Item\Type constant
	 * @return DynamicLogicType|null The corresponding DynamicLogic\Type or null if no mapping exists
	 */
	public static function whereToDynamicLogicType(string $whereType): ?DynamicLogicType {
		if (!isset(self::$typeMap[$whereType])) {
			return null;
		}

		return DynamicLogicType::from(self::$typeMap[$whereType]);
	}

	/**
	 * Convert DynamicLogic\Type to Where\Item\Type
	 *
	 * @param  DynamicLogicType $dynamicLogicType The DynamicLogic\Type enum
	 * @return string|null      The corresponding Where\Item\Type constant or null if no mapping exists
	 */
	public static function dynamicLogicToWhereType(DynamicLogicType|string $dynamicLogicType): ?string {
		$flipped = array_flip(self::$typeMap);

		return $flipped[is_string($dynamicLogicType) ? $dynamicLogicType : $dynamicLogicType->value] ?? null;
	}

	/**
	 * Check if a Where\Item\Type can be converted to DynamicLogic\Type
	 *
	 * @param  string $whereType The Where\Item\Type constant
	 * @return bool   True if the type can be converted
	 */
	public static function canConvertWhereType(string $whereType): bool {
		return isset(self::$typeMap[$whereType]);
	}

	/**
	 * Check if a DynamicLogic\Type can be converted to Where\Item\Type
	 *
	 * @param  DynamicLogicType $dynamicLogicType The DynamicLogic\Type enum
	 * @return bool             True if the type can be converted
	 */
	public static function canConvertDynamicLogicType(DynamicLogicType $dynamicLogicType): bool {
		$flipped = array_flip(self::$typeMap);

		return isset($flipped[$dynamicLogicType->value]);
	}

}