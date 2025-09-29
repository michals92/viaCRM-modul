<?php

namespace Espo\Modules\ViaCrm\Hooks\Offer;

use Espo\Core\Hook\Hook\AfterSave;
use Espo\Core\Hook\Hook\AfterRemove;
use Espo\Core\Hook\Hook\BeforeSave;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Repository\Option\SaveOptions;
use Espo\ORM\Repository\Option\RemoveOptions;
use Espo\Core\Di;

class UpdateProductQuantities implements
    AfterSave,
    AfterRemove,
    BeforeSave,
    Di\EntityManagerAware,
    Di\ServiceFactoryAware
{
    use Di\EntityManagerSetter;
    use Di\ServiceFactorySetter;

    private array $previousItems = [];

    /**
     * Store previous items before save to compare later
     */
    public function beforeSave(Entity $entity, SaveOptions $options): void
    {
        if (!$entity->isNew()) {
            $existingOffer = $this->entityManager->getEntity('Offer', $entity->getId());
            if ($existingOffer) {
                $this->previousItems[$entity->getId()] = $existingOffer->get('offerItems') ?? [];
            }
        }
    }

    /**
     * After saving an offer, update product quantities
     */
    public function afterSave(Entity $entity, SaveOptions $options): void
    {
        $this->updateProductQuantitiesFromOffer($entity);
    }

    /**
     * After removing an offer, update product quantities
     */
    public function afterRemove(Entity $entity, RemoveOptions $options): void
    {
        // Store items before removal for processing
        $offerItems = $entity->get('offerItems');
        if (is_array($offerItems)) {
            $this->updateProductQuantitiesFromItems($offerItems);
        }
    }

    /**
     * Update product quantities based on offer items
     */
    private function updateProductQuantitiesFromOffer(Entity $offer): void
    {
        $currentItems = $offer->get('offerItems') ?? [];
        $previousItems = $this->previousItems[$offer->getId()] ?? [];
        
        // Convert to arrays if they are objects
        if (is_object($currentItems)) {
            $currentItems = json_decode(json_encode($currentItems), true);
        }
        if (is_object($previousItems)) {
            $previousItems = json_decode(json_encode($previousItems), true);
        }
        
        // Ensure they are arrays
        if (!is_array($currentItems)) {
            $currentItems = [];
        }
        if (!is_array($previousItems)) {
            $previousItems = [];
        }
        
        // Collect all affected product IDs
        $affectedProductIds = [];
        
        // Get product IDs from current items
        foreach ($currentItems as $item) {
            $itemArray = is_object($item) ? (array) $item : $item;
            if (isset($itemArray['productId']) && !empty($itemArray['productId'])) {
                $affectedProductIds[$itemArray['productId']] = true;
            }
        }
        
        // Get product IDs from previous items
        foreach ($previousItems as $item) {
            $itemArray = is_object($item) ? (array) $item : $item;
            if (isset($itemArray['productId']) && !empty($itemArray['productId'])) {
                $affectedProductIds[$itemArray['productId']] = true;
            }
        }
        
        // Update quantities for all affected products
        $this->updateProductQuantitiesById(array_keys($affectedProductIds));
        
        // Clean up stored previous items
        unset($this->previousItems[$offer->getId()]);
    }

    /**
     * Update product quantities from items array
     */
    private function updateProductQuantitiesFromItems($items): void
    {
        // Convert to array if it's an object
        if (is_object($items)) {
            $items = json_decode(json_encode($items), true);
        }
        
        if (!is_array($items)) {
            return;
        }
        
        $productIds = [];
        foreach ($items as $item) {
            $itemArray = is_object($item) ? (array) $item : $item;
            if (isset($itemArray['productId']) && !empty($itemArray['productId'])) {
                $productIds[] = $itemArray['productId'];
            }
        }
        
        if (!empty($productIds)) {
            $this->updateProductQuantitiesById($productIds);
        }
    }

    /**
     * Update quantities for specific product IDs
     */
    private function updateProductQuantitiesById(array $productIds): void
    {
        if (empty($productIds)) {
            return;
        }

        $productsItemsService = $this->serviceFactory->create('ProductsItems');
        
        foreach ($productIds as $productId) {
            $productsItemsService->updateCalculatedFields($productId);
        }
    }
}