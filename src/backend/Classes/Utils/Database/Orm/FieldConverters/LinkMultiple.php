<?php

namespace Espo\Modules\Viacrm\Classes\Utils\Database\Orm\FieldConverters;

use Espo\Core\Utils\Database\Orm\Defs\AttributeDefs;
use Espo\Core\Utils\Database\Orm\Defs\EntityDefs;
use Espo\ORM\Defs\FieldDefs;
use Espo\ORM\Type\AttributeType;

class LinkMultiple extends \Espo\Core\Utils\Database\Orm\FieldConverters\LinkMultiple
{
	public function convert(FieldDefs $fieldDefs, string $entityType): EntityDefs
	{
		$entityDefs = parent::convert($fieldDefs, $entityType);

		$recordListEnabled = $fieldDefs->getParam('recordListEnabled');
		if ($recordListEnabled) {
			$recordListName = $fieldDefs->getName() . 'RecordList';
			$entityDefs = $entityDefs->withAttribute(
				AttributeDefs::create($recordListName)
					->withType(AttributeType::JSON_ARRAY)
					->withNotStorable()
					->withParamsMerged([
						'attributeRole' => 'recordList',
					])
			);
		}

		$columnListEnabled = $fieldDefs->getParam('columnListEnabled');
		if ($columnListEnabled) {
			$columnListName = $fieldDefs->getName() . 'ColumnList';
			$entityDefs = $entityDefs->withAttribute(
				AttributeDefs::create($columnListName)
					->withType(AttributeType::JSON_ARRAY)
					->withNotStorable()
					->withParamsMerged([
						'attributeRole' => 'columnList',
					])
			);
		}

		return $entityDefs;
	}
}
