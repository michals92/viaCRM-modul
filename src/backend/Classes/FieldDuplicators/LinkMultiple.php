<?php

namespace Espo\Modules\Viacrm\Classes\FieldDuplicators;

use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\FieldUtil;
use Espo\ORM\Entity;
use stdClass;

class LinkMultiple extends \Espo\Classes\FieldDuplicators\LinkMultiple {

	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly FieldUtil $fieldUtil
	) {
		parent::__construct($entityManager);
	}

	public function duplicate(Entity $entity, string $field): stdClass {
		$entityType = $entity->getEntityType();
		$defs = $this->entityManager->getDefs();

		$fieldDefs = $defs
		    ->getEntity($entityType)
		    ->getField($field);

		if (!$fieldDefs->getParam('recordListEnabled')) {
			return parent::duplicate($entity, $field);
		} else {
			$valueMap = new stdClass();

			$recordListName = $field . 'RecordList';

			$recordList = $entity->get($recordListName) ?? [];

			if ($fieldDefs->getParam('createWhenDuplicating')) {
				// Get foreign entity type from relation
				$relationDefs = $defs->getEntity($entityType)->getRelation($field);
				$foreignEntityType = $relationDefs->getForeignEntityType();
				$foreignEntityDefs = $defs->getEntity($foreignEntityType);

				foreach ($recordList as $record) {
					// Deleting the id causes a new one to be created
					unset($record->id);

					// Remove fields with duplicateIgnore from child records
					foreach ($foreignEntityDefs->getFieldList() as $childFieldDefs) {
						if ($childFieldDefs->getParam('duplicateIgnore')) {
							$fieldName = $childFieldDefs->getName();
							$attributeList = $this->fieldUtil->getAttributeList($foreignEntityType, $fieldName);

							foreach ($attributeList as $attribute) {
								if (property_exists($record, $attribute)) {
									unset($record->$attribute);
								}
							}
						}
					}
				}
			}

			$valueMap->$recordListName = $recordList;

			return $valueMap;
		}
	}

}