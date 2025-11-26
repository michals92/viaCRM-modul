<?php

namespace Espo\Modules\Viacrm\Core\Utils\Database\Orm\FieldConverters;

use Espo\Core\Utils\Database\Orm\Defs\AttributeDefs;
use Espo\Core\Utils\Database\Orm\Defs\EntityDefs;
use Espo\Core\Utils\Database\Orm\FieldConverter;
use Espo\ORM\Defs\FieldDefs;
use Espo\ORM\Type\AttributeType;

class SequenceNumber implements FieldConverter
{
	public function convert(FieldDefs $fieldDefs, string $entityType): EntityDefs
	{
		$name = $fieldDefs->getName();

		$valueDefs = AttributeDefs::create($name)
			->withType(AttributeType::VARCHAR)
			->withLength(36)
			->withParamsMerged([
				'attributeRole' => 'value',
				'fieldType' => 'sequenceNumber',
			]);

		$allowCustomValueDefs = null;

		if ($fieldDefs->getParam('allowCustomValue')) {
			$allowCustomValueDefs = AttributeDefs::create($name . 'IsCustomValue')
				->withType(AttributeType::BOOL)
				->withParamsMerged([
					'attributeRole' => 'isCustomValue',
					'fieldType' => 'sequenceNumber',
				]);
		}

		if ($fieldDefs->isNotStorable()) {
			$valueDefs = $valueDefs->withNotStorable();

			if ($allowCustomValueDefs) {
				$allowCustomValueDefs = $allowCustomValueDefs->withNotStorable();
			}
		}

		$entityDefs = EntityDefs::create()
			->withAttribute($valueDefs);

		if ($allowCustomValueDefs) {
			$entityDefs = $entityDefs->withAttribute($allowCustomValueDefs);
		}

		return $entityDefs;
	}
}
