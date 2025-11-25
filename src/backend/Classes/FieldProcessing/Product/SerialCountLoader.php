<?php

namespace Espo\Modules\Viacrm\Classes\FieldProcessing\Product;

use Espo\Core\FieldProcessing\Loader;
use Espo\Core\FieldProcessing\Loader\Params;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * @implements Loader<\Espo\Modules\Viacrm\Entities\Product>
 */
class SerialCountLoader implements Loader
{
    public function __construct(
        private readonly EntityManager $entityManager
    ) {
    }

    public function process(Entity $entity, Params $params): void
    {
        $em = $this->entityManager;
        $productId = $entity->getId();

        if (!$productId) {
            return;
        }

        // Get total count of serial numbers
        $totalCount = $em
            ->getRDBRepository('ProductSerial')
            ->where(['productId' => $productId, 'deleted' => false])
            ->count();

        // Get count of active serial numbers
        $activeCount = $em
            ->getRDBRepository('ProductSerial')
            ->where(['productId' => $productId, 'status' => 'Active', 'deleted' => false])
            ->count();

        $entity->set('serialTotalCount', $totalCount);
        $entity->set('serialActiveCount', $activeCount);
    }
}
