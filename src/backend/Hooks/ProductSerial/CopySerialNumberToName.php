<?php

namespace Espo\Modules\Viacrm\Hooks\ProductSerial;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Modules\Viacrm\Entities\ProductSerial;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements BeforeSave<ProductSerial>
 */
class CopySerialNumberToName implements BeforeSave
{
    public static int $order = 9;

    public function beforeSave(Entity $entity, SaveOptions $options): void
    {
        if ($entity->isAttributeChanged('serialNumber')) {
            $serialNumber = $entity->get('serialNumber');
            if ($serialNumber) {
                $entity->set('name', $serialNumber);
            }
        }
    }
}
