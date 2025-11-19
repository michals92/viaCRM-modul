<?php

namespace Espo\Modules\Autocrm\Core\Utils\Database\Orm\FieldConverters;

use Espo\Core\Utils\Database\Orm\Defs\AttributeDefs;
use Espo\Core\Utils\Database\Orm\Defs\EntityDefs;
use Espo\Core\Utils\Database\Orm\FieldConverter;
use Espo\ORM\Defs\FieldDefs;
use Espo\ORM\Type\AttributeType;

class FloatWithUnit implements FieldConverter {

	public function convert(FieldDefs $fieldDefs, string $entityType): EntityDefs {
		$name = $fieldDefs->getName();

		$amountDefs = AttributeDefs::create($name)
		    ->withType(AttributeType::FLOAT)
		    ->withParamsMerged([
		        'attributeRole' => 'value',
		        'fieldType' => 'floatWIthUnit',
		    ]);

		$currencyDefs = AttributeDefs::create($name . 'Unit')
		    ->withType(AttributeType::VARCHAR)
		    ->withParamsMerged([
		        'attributeRole' => 'unit',
		        'fieldType' => 'floatWIthUnit',
		    ]);

		if ($fieldDefs->isNotStorable()) {
			$amountDefs = $amountDefs->withNotStorable();
			$currencyDefs = $currencyDefs->withNotStorable();
		}

		$entityDefs = EntityDefs::create()
		    ->withAttribute($amountDefs)
		    ->withAttribute($currencyDefs);

		return $entityDefs;
	}

}
