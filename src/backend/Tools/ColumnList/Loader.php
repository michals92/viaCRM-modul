<?php

namespace Espo\Modules\Viacrm\Tools\ColumnList;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Select\SearchParams;
use Espo\Modules\Viacrm\Tools\RecordList\Service as RecordListService;
use Espo\ORM\Defs;
use Espo\ORM\Entity;

class Loader
{
	public function __construct(
		private readonly RecordListService $recordListService,
		private readonly Defs $defs
	) {
	}

	/**
	 * @param string[] $attributeList
	 *
	 * @throws BadRequest
	 * @throws Forbidden
	 * @throws Error
	 * @throws NotFound
	 *
	 * @return array<int, object>
	 */
	private function getRecords(
		string $entityType,
		string $id,
		string $link,
		array $attributeList
	): array {
		return $this->recordListService->obtain(
			$entityType,
			$id,
			$link,
			SearchParams::create()->withSelect($attributeList)
		)->getValueMapList();
	}

	/**
	 * @param Entity $entity
	 * @param string $field
	 *
	 * @throws BadRequest
	 * @throws Error
	 * @throws Forbidden
	 * @throws NotFound
	 */
	public function load(Entity $entity, string $field): void
	{
		$entityType = $entity->getEntityType();
		$entityDefs = $this->defs->getEntity($entityType);
		$fieldDefs = $entityDefs->getField($field);
		$hasParentLink = $fieldDefs->getParam('columnListLink') && $fieldDefs->getParam('columnListForeign');
		$records = [];

		if ($hasParentLink) {
			$parentLink = $fieldDefs->getParam('columnListLink');
			$childLink = $fieldDefs->getParam('columnListForeign');
			$parentLinkDefs = $entityDefs->getRelation($parentLink);
			$parentEntityType = $parentLinkDefs->getForeignEntityType();
			$childFieldDefs = $this->defs->getEntity($parentEntityType)->getField($childLink);
			$columns = $childFieldDefs->getParam('columns') ?? [];

			if (empty($columns)) {
				throw new Error("No columns defined for field '{$childLink}' in entity '{$parentEntityType}'");
			}

			$parentEntities = $this->getRecords(
				$entityType,
				$entity->getId(),
				$parentLink,
				['id', 'name']
			);

			foreach ($parentEntities as $parentEntity) {
				$childEntities = $this->getRecords(
					$parentEntityType,
					$parentEntity->id ?? null,
					$childLink,
					['id', 'name', ...array_values($columns)]
				);

				$this->appendRecordsToArray($records, $parentEntity, $childEntities, $columns);
			}
		} else {
			$columns = $fieldDefs->getParam('columns') ?? [];
			if (empty($columns)) {
				throw new Error("No columns defined for field '{$field}' in entity '{$entityType}'");
			}

			$childEntities = $this->getRecords(
				$entityType,
				$entity->getId(),
				$field,
				['id', 'name', ...array_values($columns)]
			);

			$this->appendRecordsToArray($records, null, $childEntities, $columns);
		}

		$attributeName = $field . 'ColumnList';
		if (!$entity->isNew() && !$entity->hasFetched($attributeName)) {
			$entity->setFetched($attributeName, $records);
		}
		if (!empty($records)) {
			$entity->set($attributeName, $records);
		}
	}

	/**
	 * @param array<int, array<string, mixed>> &$records
	 * @param object|null                      $parentEntity
	 * @param array<int, object>               $childEntities
	 * @param array<string, string>            $columns
	 */
	private function appendRecordsToArray(array &$records, ?object $parentEntity, array $childEntities, array $columns): void
	{
		foreach ($childEntities as $childEntity) {
			$record = [
				'id' => $childEntity->id ?? null,
				'name' => $childEntity->name ?? null,
				'parentEntityId' => $parentEntity?->id ?? null,
				'parentEntityName' => $parentEntity?->name ?? null,
				'columns' => array_intersect_key(
					(array) $childEntity,
					array_flip($columns)
				),
			];
			$records[] = $record;
		}
	}
}
