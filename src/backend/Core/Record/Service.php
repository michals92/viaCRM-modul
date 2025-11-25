<?php

namespace Espo\Modules\Viacrm\Core\Record;

use Espo\Core\Record\Service as BaseService;
use stdClass;

/**
 * @extends BaseService<\Espo\ORM\Entity>
 */
class Service extends BaseService {

	public function getDuplicateAttributes(string $id): stdClass {
		$attributes = parent::getDuplicateAttributes($id);
        
		$reflection = new \ReflectionObject($attributes);
		$properties = $reflection->getProperties();
        
		foreach ($properties as $property) {
			$propertyName = $property->getName();
            
			if (str_ends_with($propertyName, 'RecordList')) {
				$recordList = $attributes->$propertyName ?? null;
                
				if (is_array($recordList) || ($recordList instanceof \Traversable)) {
					foreach ($recordList as $item) {
						if (is_object($item) && property_exists($item, 'id')) {
							unset($item->id);
						}
					}
				}
			}
		}
        
		foreach ($properties as $property) {
			$propertyName = $property->getName();
            
			if (str_ends_with($propertyName, 'Ids')) {
				unset($attributes->$propertyName);
			}
		}
        
		return $attributes;
	}

}