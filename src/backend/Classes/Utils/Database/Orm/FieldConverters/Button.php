<?php

namespace Espo\Modules\Autocrm\Classes\Utils\Database\Orm\FieldConverters;

use Espo\Core\Utils\Database\Orm\Defs\AttributeDefs;
use Espo\Core\Utils\Database\Orm\Defs\EntityDefs;
use Espo\Core\Utils\Database\Orm\FieldConverter;
use Espo\ORM\Defs\FieldDefs;
use Espo\ORM\Type\AttributeType;

/**
 * We have to have this for the noSelect so that the button field won't appear in a select query
 */
class Button implements FieldConverter {

	public function convert(FieldDefs $fieldDefs, string $entityType): EntityDefs {
		$name = $fieldDefs->getName();

		$attributeDefs = AttributeDefs::create($name)
		    ->withType(AttributeType::VARCHAR)
		    ->withNotStorable()
		    ->withParam('noSelect', true);

		return EntityDefs::create()
		    ->withAttribute($attributeDefs);
	}

}
