<?php

namespace Espo\Modules\Viacrm\Core\Field\LinkMultiple;

use Espo\Core\Field\LinkMultiple;
use Espo\Core\Field\LinkMultipleItem;
use Espo\Core\ORM\Entity as CoreEntity;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Entity;
use InvalidArgumentException;
use RuntimeException;
use stdClass;

/** This class backports some fixes from Espo 9 */
class LinkMultipleFactory extends \Espo\Core\Field\LinkMultiple\LinkMultipleFactory
{
	public function createFromEntity(Entity $entity, string $field): LinkMultiple
	{
		if (!$this->isCreatableFromEntity($entity, $field)) {
			throw new RuntimeException();
		}

		if (!$entity instanceof CoreEntity) {
			throw new InvalidArgumentException();
		}

		$itemList = [];

		if (!$entity->has($field . 'Ids') && !$entity->isNew()) {
			$this->loadLinkMultipleField($entity, $field);
		}

		$idList = $entity->getLinkMultipleIdList($field);

		$nameMap = $entity->get($field . 'Names') ?? (object) [];

		$columnData = null;

		if ($entity->hasAttribute($field . 'Columns')) {
			$columnData = $entity->get($field . 'Columns') ?
				$entity->get($field . 'Columns') :
				$this->loadColumnData($entity, $field);
		}

		foreach ($idList as $id) {
			$item = LinkMultipleItem::create($id);

			if ($columnData && property_exists($columnData, $id)) {
				$item = ReflectionUtil::callClassMethod(parent::class, $this, 'addColumnValues', $item, $columnData->$id);
			}

			$name = $nameMap->$id ?? null;

			if ($name !== null) {
				$item = $item->withName($name);
			}

			$itemList[] = $item;
		}

		return new LinkMultiple($itemList);
	}

	private function loadLinkMultipleField(CoreEntity $entity, string $field): void
	{
		$entity->loadLinkMultipleField($field);
	}

	private function loadColumnData(Entity $entity, string $field): stdClass
	{
		if ($entity->isNew()) {
			return (object) [];
		}

		$columnData = (object) [];

		$select = ['id'];

		$entityDefs = ReflectionUtil::getClassProperty(parent::class, $this, 'ormDefs')
			->getEntity($entity->getEntityType());

		$columns = $entityDefs->getField($field)->getParam('columns') ?? [];

		if (count($columns) === 0) {
			return $columnData;
		}

		/** This part is backported from Espo 9 */
		$foreignEntityType = $entityDefs->tryGetRelation($field)?->tryGetForeignEntityType();

		if ($foreignEntityType) {
			$foreignEntityDefs = ReflectionUtil::getClassProperty(parent::class, $this, 'entityManager')->getDefs()->getEntity($foreignEntityType);

			foreach ($columns as $column => $attribute) {
				if (!$foreignEntityDefs->hasAttribute($attribute)) {
					// For backward compatibility. If foreign attributes defined in the field do not exist.
					unset($columns[$column]);
				}
			}
		}

		/** End of backported code */
		foreach ($columns as $item) {
			$select[] = $item;
		}

		$collection = ReflectionUtil::getClassProperty(parent::class, $this, 'entityManager')
			->getRelation($entity, $field)
			->select($select)
			->find();

		foreach ($collection as $itemEntity) {
			$id = $itemEntity->getId();

			$columnData->$id = (object) [];

			foreach ($columns as $column => $attribute) {
				$columnData->$id->$column = $itemEntity->get($attribute);
			}
		}

		return $columnData;
	}
}
