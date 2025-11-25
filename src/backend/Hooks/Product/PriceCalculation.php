<?php

namespace Espo\Modules\Viacrm\Hooks\Product;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Core\Record\ServiceContainer as RecordServiceContainer;
use Espo\Modules\Viacrm\Entities\Product;
use Espo\Modules\Viacrm\Services\Product as ProductService;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements BeforeSave<Product>
 */
class PriceCalculation implements BeforeSave
{
    public static int $order = 9;

    public function __construct(
        protected readonly RecordServiceContainer $recordServiceContainer,
    ) {
    }

    /**
     * @param Product $entity
     */
    public function beforeSave(Entity $entity, SaveOptions $options): void
    {
        $productService = $this->getRecordService();
        $productService->calculatePricing($entity, $options->toAssoc());
    }

    protected function getRecordService(): ProductService
    {
        /** @var ProductService */
        $service = $this->recordServiceContainer->get(Product::ENTITY_TYPE);

        return $service;
    }
}
