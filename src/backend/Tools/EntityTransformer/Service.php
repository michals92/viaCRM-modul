<?php

namespace Espo\Modules\Viacrm\Tools\EntityTransformer;

use Espo\ORM\Entity;
use Espo\ORM\EntityCollection;
use Espo\ORM\EntityManager;

class Service
{
	public function __construct(
		private readonly EntityManager $entityManager
	) {
	}

	/**
	 * Transforms a source entity into a target entity based on the provided attribute mapping.
	 *
	 * @param Entity                $sourceEntity     the source entity to transform
	 * @param string                $targetEntityType the type of the target entity
	 * @param array<string, string> $attributeMapping Mapping of attributes (e.g., ['sourceAttribute' => 'targetAttribute']).
	 *
	 * @return Entity the transformed target entity
	 */
	public function transformEntity(Entity $sourceEntity, string $targetEntityType, array $attributeMapping): Entity
	{
		// Create a new instance of the target entity
		$targetEntity = $this->entityManager->getNewEntity($targetEntityType);

		// Map attributes from the source entity to the target entity
		foreach ($attributeMapping as $sourceAttribute => $targetAttribute) {
			$value = $sourceEntity->get($sourceAttribute);

			// If this is a RecordList attribute, process its value
			if ($this->isRecordListAttribute($sourceAttribute)) {
				$value = $this->processRecordListValue($value);
			}

			$targetEntity->set($targetAttribute, $value);
		}

		return $targetEntity;
	}

	private function isRecordListAttribute(string $attributeName): bool
	{
		return str_contains($attributeName, 'RecordList');
	}

	/**
	 * @param array<int, object> $value
	 *
	 * @return array<int, object>
	 */
	private function processRecordListValue(array $value): array
	{
		foreach ($value as $item) {
			if (isset($item->id)) {
				unset($item->id);
			}
		}

		return $value;
	}

	/**
	 * Transforms a collection of source entities into a collection of target entities.
	 *
	 * @param EntityCollection<Entity> $sourceEntities   the collection of source entities to transform
	 * @param string                   $targetEntityType the type of the target entity
	 * @param array<string, string>    $attributeMapping mapping of attributes
	 *
	 * @return EntityCollection<Entity> the collection of transformed target entities
	 */
	public function transformEntities(EntityCollection $sourceEntities, string $targetEntityType, array $attributeMapping): EntityCollection
	{
		// Create a new collection for the target entities
		$targetEntities = new EntityCollection();

		// Transform each source entity into a target entity and add it to the collection
		foreach ($sourceEntities as $sourceEntity) {
			$targetEntity = $this->transformEntity($sourceEntity, $targetEntityType, $attributeMapping);
			$targetEntities->append($targetEntity);
		}

		return $targetEntities;
	}
}
