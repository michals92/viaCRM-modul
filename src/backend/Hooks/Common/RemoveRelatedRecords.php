<?php

namespace Espo\Modules\Viacrm\Hooks\Common;

use Espo\Core\Hook\Hook\AfterRemove;
use Espo\Core\Utils\Log;
use Espo\Core\Utils\Metadata;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Repository\Option\RemoveOptions;

/**
 * @implements AfterRemove<Entity>
 */
class RemoveRelatedRecords implements AfterRemove
{
	public static int $order = 9;

	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly Metadata $metadata,
		private readonly Log $log,
	) {
	}

	public function afterRemove(Entity $entity, RemoveOptions $options): void
	{
		$entityType = $entity->getEntityType();
		$entityDefs = $this->metadata->get(['entityDefs', $entityType]) ?? [];

		if (empty($entityDefs['fields'])) {
			return;
		}

		foreach ($entityDefs['fields'] as $fieldName => $fieldDefs) {
			if (($fieldDefs['type'] ?? null) !== 'linkMultiple') {
				continue;
			}

			if (!($fieldDefs['removeAfterParent'] ?? false)) {
				continue;
			}

			$this->removeRelatedRecordsForField($entity, $fieldName);
		}
	}

	private function removeRelatedRecordsForField(Entity $entity, string $fieldName): void
	{
		$em = $this->entityManager;
		try {
			$relatedRecords = $em->getRelation($entity, $fieldName)->find();

			foreach ($relatedRecords as $relatedRecord) {
				$em->removeEntity($relatedRecord);
			}
		} catch (\Throwable $e) {
			$this->log->error('Failed to remove related records', [
				'entityType' => $entity->getEntityType(),
				'entityId' => $entity->getId(),
				'fieldName' => $fieldName,
				'error' => $e->getMessage(),
			]);
		}
	}
}
