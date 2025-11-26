<?php

namespace Espo\Modules\Viacrm\Repositories;

use Espo\ORM\Entity;

class RecordTemplate extends \Espo\Core\Templates\Repositories\Base
{
	protected function beforeSave(Entity $entity, array $options = [])
	{
		$entityType = $entity->get('entityType');
		$entityDefs = $this->entityManager->getDefs()->getEntity($entityType);
		$data = $entity->get('data');
		$newData = [];

		foreach ($data as $attribute => $value) {
			if (!$entityDefs->hasAttribute($attribute)) {
				continue;
			}

			$defaultValue = $entityDefs->getAttribute($attribute)->getParam('default');

			if ($defaultValue && $value === $defaultValue) {
				continue;
			}

			if (!$value) {
				continue;
			}

			$newData[$attribute] = $value;
		}

		$entity->set('data', $newData);

		parent::beforeSave($entity, $options);
	}
}
