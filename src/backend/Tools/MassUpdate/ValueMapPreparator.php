<?php

namespace Espo\Modules\Viacrm\Tools\MassUpdate;

use Espo\ORM\Entity;
use Espo\Tools\MassUpdate\Data;
use stdClass;

/**
 * Extends MassActions with custom actions (addition, multiplication) for numeric fields.
 */
class ValueMapPreparator extends \Espo\Tools\MassUpdate\ValueMapPreparator {
	public const ACTION_INCREASE = 'increase';
	public const ACTION_MULTIPLY = 'multiply';

	public function prepare(Entity $entity, Data $data): stdClass {
		$map = parent::prepare($entity, $data);

		foreach ($data->getAttributeList() as $attribute) {
			if ($data->getValue($attribute) === null) {
				continue;
			}

			if (!$entity->has($attribute)) {
				continue;
			}

			if (!$this->isTypeNumeric($entity, $attribute)) {
				continue;
			}

			$attributeValue = $entity->get($attribute);

			if ($attributeValue === null) {
				continue;
			}

			$value = $data->getValue($attribute);

			if (!is_numeric($value)) {
				continue;
			}

			$value = (float)$value;

			$action = $data->getAction($attribute);
            
			if ($action == self::ACTION_INCREASE) {
				$map->$attribute = $attributeValue + $value;

				continue;
			}

			if ($action == self::ACTION_MULTIPLY) {
				$map->$attribute = $attributeValue * $value;

				continue;
			}
		}

		return $map;
	}

	private function isTypeNumeric(Entity $entity, string $attribute): bool {
		$type = $entity->getAttributeType($attribute);

		return in_array($type, ['int', 'float', 'currency'], true);
	}
}
