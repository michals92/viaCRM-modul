<?php

namespace Espo\Modules\ViaCrm\Classes\Utils;

use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Metadata;

class StatusOptionsProvider
{
    private $metadata;

    public function __construct(Metadata $metadata)
    {
        $this->metadata = $metadata;
    }

    /**
     * Get status options for Order entity
     */
    public function getOrderStatusOptions(): array
    {
        return $this->metadata->get(['entityDefs', 'Order', 'fields', 'status', 'options']) ?? [];
    }

    /**
     * Get status options for Offer entity
     */
    public function getOfferStatusOptions(): array
    {
        return $this->metadata->get(['entityDefs', 'Offer', 'fields', 'status', 'options']) ?? [];
    }

    /**
     * Get all available options for ProductsItems status configuration
     */
    public function getOptionsForProductsItems(): array
    {
        return [
            'orderStatusesForCounting' => $this->getOrderStatusOptions(),
            'offerStatusesForCounting' => $this->getOfferStatusOptions(),
            'orderStatusesForStockDeduction' => $this->getOrderStatusOptions(),
            'offerStatusesForStockDeduction' => $this->getOfferStatusOptions(),
        ];
    }
}