<?php

namespace Espo\Modules\Viacrm\Core\Utils\Database\Orm\FieldConverters;

use Espo\Core\Utils\Database\Orm\Defs\AttributeDefs;
use Espo\Core\Utils\Database\Orm\Defs\EntityDefs;
use Espo\Core\Utils\Database\Orm\FieldConverter;
use Espo\ORM\Defs\FieldDefs;
use Espo\ORM\Type\AttributeType;

class ElectronicSignature implements FieldConverter {
	public function convert(FieldDefs $fieldDefs, string $entityType): EntityDefs {
		$name = $fieldDefs->getName();

		$base30Defs = AttributeDefs::create($name)
		    ->withType(AttributeType::TEXT)
		    ->withParamsMerged([
		        'attributeRole' => 'value',
		        'fieldType' => 'electronicSignature',
		    ]);

		$pngDefs = null;

		if ($fieldDefs->getParam('storePng')) {
			$pngDefs = AttributeDefs::create($name . 'Png')
			    ->withType(AttributeType::TEXT)
			    ->withParamsMerged([
			        'attributeRole' => 'pngData',
			        'fieldType' => 'electronicSignature',
			    ]);
		}

		if ($fieldDefs->isNotStorable()) {
			$base30Defs = $base30Defs->withNotStorable();
            
			if ($pngDefs) {
				$pngDefs = $pngDefs->withNotStorable();
			}
		}

		$entityDefs = EntityDefs::create()
		    ->withAttribute($base30Defs);

		if ($pngDefs) {
			$entityDefs = $entityDefs->withAttribute($pngDefs);
		}

		return $entityDefs;
	}
}
