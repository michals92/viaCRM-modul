<?php

namespace Espo\Modules\Viacrm\Classes\FieldValidators;

use Espo\Classes\FieldValidators\LinkMultipleType as BaseLinkMultipleType;
use Espo\Core\ORM\Entity as CoreEntity;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Metadata;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Defs;
use Espo\ORM\Entity;

class LinkMultipleType extends BaseLinkMultipleType {

	public function __construct(
		private readonly Metadata $metadata,
		private readonly Defs $defs,
		private readonly EntityManager $entityManager
	) {
		parent::__construct($metadata, $defs);
	}

	/** @noinspection PhpUnused */
	public function checkRequired(Entity $entity, string $field): bool {
		$recordListEnabled = $this->entityManager->getDefs()
		    ->getEntity($entity->getEntityType())
		    ->getField($field)
		    ->getParam('recordListEnabled');

		if ($recordListEnabled) {
			$recordList = $entity->get($field . 'RecordList') ?: [];

			return is_array($recordList) && count($recordList) > 0;
		} else {
			return parent::checkRequired($entity, $field);
		}
	}

	/** @noinspection PhpUnused */
	public function checkMaxCount(Entity $entity, string $field, ?int $maxCount): bool {
		if ($maxCount === null) {
			return true;
		}

		$recordListEnabled = $this->entityManager->getDefs()
		    ->getEntity($entity->getEntityType())
		    ->getField($field)
		    ->getParam('recordListEnabled');

		if ($recordListEnabled) {
			$recordList = $entity->get($field . 'RecordList') ?: [];

			return count($recordList) <= $maxCount;
		} else {
			return parent::checkMaxCount($entity, $field, $maxCount);
		}
	}

	/** @noinspection PhpUnused */
	public function checkColumnsValid(Entity $entity, string $field): bool {
		$recordListEnabled = $this->entityManager->getDefs()
		    ->getEntity($entity->getEntityType())
		    ->getField($field)
		    ->getParam('recordListEnabled');

		if ($recordListEnabled) {
			if (!$entity instanceof CoreEntity) {
				return true;
			}

			if (!$entity->has($field . 'Columns')) {
				return true;
			}

			$entityDefs = $this->defs->getEntity($entity->getEntityType());
			$fieldDefs = $entityDefs->getField($field);

			if ($fieldDefs->isNotStorable()) {
				return true;
			}

			/** @var ?array<string, string> $columnsMap */
			$columnsMap = $fieldDefs->getParam('columns');

			if ($columnsMap === null || $columnsMap === []) {
				return true;
			}

			if (!$entityDefs->hasRelation($field)) {
				return true;
			}

			$relationDefs = $entityDefs->getRelation($field);

			if (!$relationDefs->hasForeignEntityType()) {
				return true;
			}

			$foreignEntityType = $relationDefs->getForeignEntityType();

			$recordList = $entity->get($field . 'RecordList') ?: [];

			foreach ($recordList as $record) {
				foreach ($columnsMap as $foreignField) {
					if (!property_exists($record, $foreignField)) {
						continue;
					}

					$value = $record->$foreignField;

					$result = ReflectionUtil::callClassMethod(BaseLinkMultipleType::class, $this, 'checkColumnValue', $foreignEntityType, $foreignField, $value);

					if (!$result) {
						return false;
					}
				}
			}

			return true;
		} else {
			return parent::checkColumnsValid($entity, $field);
		}
	}

}
