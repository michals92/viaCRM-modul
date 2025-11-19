<?php

namespace Espo\Modules\Autocrm\Classes\FieldProcessing\Relation;

use Espo\Core\FieldProcessing\Saver as SaverInterface;
use Espo\Core\FieldProcessing\Saver\Params as SaverParams;
use Espo\Core\ORM\EntityManager;
use Espo\Core\ORM\Repository\Option\SaveOption;
use Espo\Core\Utils\Log;
use Espo\ORM\Entity;
use Espo\ORM\Query\Part\Expression as Expr;
use stdClass;

/**
 * @implements SaverInterface<Entity>
 */
class LinkMultipleSaver implements SaverInterface {

	public const TRIGGERED_BY_RECORD_LIST = 'triggeredByRecordList';

	/**
	 * @var array<string, string[]>
	 */
	private array $fieldListMapCache = [];

	public function __construct(
		protected readonly EntityManager $entityManager,
		protected readonly Log           $log,
	) {}

	public function process(Entity $entity, SaverParams $params): void {
		$recordListOptions = $params->getOption('recordListOptions') ?? [];

		foreach ($this->getFieldList($entity->getEntityType()) as $field) {
			$this
				->entityManager
				->getTransactionManager()
				->run(
					fn() => $this->processItem($entity, $field, $recordListOptions)
				);
		}
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

			if ($defs->getType() !== 'linkMultiple') {
				continue;
			}

			if (!$entityDefs->hasRelation($name)) {
				continue;
			}

			if (!$defs->getParam('recordListEnabled') && !$defs->getParam('columnListEnabled')) {
				continue;
			}

			$list[] = $name;
		}

		$this->fieldListMapCache[$entityType] = $list;

		return $list;
	}

	private function processColumnList(Entity $entity, string $name): void {
		$columnListField = $name . 'ColumnList';

		if (!$entity->has($columnListField)) {
			return;
		}

		$columnList = $entity->get($columnListField);

		if (!is_array($columnList)) {
			return;
		}

		/** @var array<stdClass> $columnList */

		$entityDefs = $this->entityManager->getDefs()->getEntity($entity->getEntityType());
		$fieldDefs = $entityDefs->getField($name);
		$relationDefs = $entityDefs->getRelation($name);

		if ($fieldDefs->getParam('columnListLink') && $fieldDefs->getParam('columnListForeign')) {
			$columnListLink = $fieldDefs->getParam('columnListLink');
			$columnListForeign = $fieldDefs->getParam('columnListForeign');

			$parentLinkDefs = $entityDefs->getRelation($columnListLink);
			$parentEntityType = $parentLinkDefs->getForeignEntityType();

			$targetFieldDefs = $this->entityManager
				->getDefs()
				->getEntity($parentEntityType)
				->getField($columnListForeign);
		} else {
			$parentEntityType = $entity->getEntityType();
			$targetFieldDefs = $fieldDefs;
		}

		$shouldUnrelate = $relationDefs->isManyToMany() || $targetFieldDefs->getParam('columnListKeepRemoved');
		$allowedColumns = array_flip($targetFieldDefs->getParam('columns') ?? []);

		$relation = $this->entityManager
			->getRelation($entity, $name);

		$newIds = [];
		foreach ($columnList as $linkedEntity) {
			$newIds[] = $linkedEntity->id;

			if (!empty($linkedEntity->columns)) {
				$columnsData = array_intersect_key((array)$linkedEntity->columns, $allowedColumns);
				$targetEntityId = $linkedEntity->parentEntityId ?? $entity->getId();

				if (
					(!empty($columnsData))
					&& (
						$parent = $this->entityManager
							->getRDBRepository($parentEntityType)
							->getById($targetEntityId)
					)
				) {
					$relation = $this->entityManager
						->getRelation($parent, $name);

					if ($relation->isRelatedById($linkedEntity->id)) {
						$relation->updateColumnsById($linkedEntity->id, $columnsData);
					} else {
						$relation->relateById($linkedEntity->id, $columnsData);
					}
				}
			}
		}

		$oldColumnList = $entity->getFetched($columnListField);

		if (!is_iterable($oldColumnList)) {
			return;
		}

		foreach ($oldColumnList as $relatedEntityData) {
			$relatedEntityId = $relatedEntityData->id;
			if (in_array($relatedEntityId, $newIds, true)) {
				continue;
			}

			if ($parentEntityId = $relatedEntityData->parentEntityId) {
				if ($parentEntity = $this->entityManager->getEntityById($parentEntityType ,$parentEntityId)) {
					$relation = $this->entityManager->getRelation($parentEntity, $name);
				}
			}

			if ($shouldUnrelate) {
				$relation->unrelateById($relatedEntityId);
			} else {
				$toBeRemovedEntity = $this->entityManager->getEntityById($parentEntityType, $relatedEntityId);

				if ($toBeRemovedEntity) {
					$this->entityManager->removeEntity($toBeRemovedEntity);
				}
			}
		}
	}

	/**
	 * @param array<string, mixed> $options
	 */
	private function processItem(Entity $entity, string $name, array $options = []): void {
		// Lock row
		$this->entityManager
			->getRDBRepository($entity->getEntityType())
			->select(['id'])
			->forUpdate()
			->where(Expr::equal(Expr::column('id'), $entity->getId()))
			->findOne();

		$entityDefs = $this->entityManager
			->getDefs()
			->getEntity($entity->getEntityType());

		$fieldDefs = $entityDefs->getField($name);

		// Handle recordList
		if ($fieldDefs->getParam('recordListEnabled')) {
			$this->processRecordList($entity, $name, $options);
		}

		// Handle columnList
		if ($fieldDefs->getParam('columnListEnabled')) {
			$this->processColumnList($entity, $name);
		}
	}

	/**
	 * @param array<string, mixed> $options
	 */
	private function processRecordList(Entity $entity, string $name, array $options): void {
		$fieldName = $name . 'RecordList';

		if (!$entity->has($fieldName)) {
			return;
		}

		/** @var stdClass[] $recordList */
		$recordList = $entity->get($fieldName);

		if (!is_array($recordList)) {
			return;
		}

		$entityDefs = $this->entityManager
			->getDefs()
			->getEntity($entity->getEntityType());

		$fieldDefs = $entityDefs->getField($name);
		$relationDefs = $entityDefs->getRelation($name);
		$recordType = $relationDefs->getForeignEntityType();

		$rdbRelation = $this->entityManager
			->getRelation($entity, $name);

		$columns = array_flip($fieldDefs->getParam('columns') ?: []);

		$existingRecordMap = [];

		$ids = array_column($recordList, 'id');

		if (!empty($ids)) {
			$existingRecords = $this->entityManager
				->getRDBRepository($recordType)
				->where(
					Expr::in(
						Expr::column('id'),
						array_column($recordList, 'id')
					)
				)
				->find();

			foreach ($existingRecords as $existingRecord) {
				$existingRecordMap[$existingRecord->getId()] = $existingRecord;
			}
		}

		$options[self::TRIGGERED_BY_RECORD_LIST] = true;

		foreach ($recordList as &$recordData) {
			$recordId = $recordData->id ?? null;

			if ($recordId) {
				$recordEntity = $existingRecordMap[$recordId] ?? null;
			} else {
				$recordEntity = $this->entityManager->getNewEntity($recordType);
			}

			if (!$recordEntity) {
				$this->log->error('Record entity not found', ['entityType' => $recordType, 'recordId' => $recordId]);
				continue;
			}

			$data = [];
			$columnsData = [];

			foreach ((array)$recordData as $attribute => $value) {
				$column = $columns[$attribute] ?? null;

				if ($column) {
					$columnsData[$column] = $value;
				} else {
					$data[$attribute] = $value;
				}
			}

			// Remove duplicateIgnore fields ONLY when creating records during duplication
			// (not for manually created records)
			if (!$recordId && !empty($options[SaveOption::DUPLICATE_SOURCE_ID])) {
				$foreignEntityDefs = $this->entityManager->getDefs()->getEntity($recordType);
				foreach ($foreignEntityDefs->getFieldList() as $childFieldDefs) {
					if ($childFieldDefs->getParam('duplicateIgnore')) {
						$fieldName = $childFieldDefs->getName();
						// Remove from data array (just the main attribute)
						if (array_key_exists($fieldName, $data)) {
							unset($data[$fieldName]);
						}
					}
				}
			}

			$recordEntity->set($data);

			// For new records in hasMany/hasOne relations, set foreign key BEFORE save
			// so that hooks have access to the parent relation
			if (!$recordId && in_array($relationDefs->getType(), ['hasMany', 'hasOne'], true)) {
				$foreignRelationName = $relationDefs->getParam('foreign');
				if ($foreignRelationName) {
					$foreignKeyField = $foreignRelationName . 'Id';
					// Only set if not already provided from frontend
					if (!$recordEntity->get($foreignKeyField)) {
						$recordEntity->set($foreignKeyField, $entity->getId());
					}
				}
			}

			$this->entityManager->saveEntity($recordEntity, $options);

			if (!$recordId) {
				$recordData->id = $recordEntity->getId();
			}

			// relate() will handle manyMany relations or update columns if needed
			if ($rdbRelation->isRelated($recordEntity)) {
				if (!empty($columnsData)) {
					$rdbRelation->updateColumns($recordEntity, $columnsData);
				}
			} else {
				$rdbRelation->relate($recordEntity, $columnsData, $options);
			}
		}

		$entity->set($fieldName, $recordList);

		$shouldUnrelate = $relationDefs->isManyToMany() || $fieldDefs->getParam('recordListKeepRemoved');

		$toRemove = $rdbRelation;

		if (!empty($recordList)) {
			$toRemove = $toRemove->where(Expr::notIn(Expr::column('id'), array_column($recordList, 'id')));
		}

		$toRemove = iterator_to_array($toRemove->find(), false);

		foreach ($toRemove as $toRemoveEntity) {
			if ($shouldUnrelate) {
				$rdbRelation->unrelate($toRemoveEntity, $options);
			} else {
				$this->entityManager->removeEntity($toRemoveEntity, $options);
			}
		}
	}

}
