<?php

namespace Espo\Modules\ViaCrm\Services;

use Espo\Services\Record;
use Espo\ORM\Entity;

class ProductsItems extends Record
{
    /**
     * Convert items data to array format safely
     */
    private function normalizeItemsData($items): array
    {
        if (empty($items)) {
            return [];
        }

        if (is_array($items)) {
            return $items;
        }

        if (is_object($items)) {
            // Convert object to array more efficiently
            return (array) $items;
        }

        return [];
    }

    /**
     * Calculate quantity from entity items for a specific product
     */
    private function calculateQuantityFromEntity(
        string $entityType, 
        string $itemsField, 
        array $statuses, 
        string $productId
    ): int {
        $repository = $this->entityManager->getRDBRepository($entityType);
        
        $entities = $repository
            ->where(['status' => $statuses])
            ->find();

        $totalQuantity = 0;

        foreach ($entities as $entity) {
            $items = $this->normalizeItemsData($entity->get($itemsField));
            
            foreach ($items as $item) {
                $itemArray = is_object($item) ? (array) $item : $item;
                
                if (isset($itemArray['productId']) && $itemArray['productId'] === $productId) {
                    $totalQuantity += (int) ($itemArray['quantity'] ?? 0);
                }
            }
        }

        return $totalQuantity;
    }

    /**
     * Calculate total quantity from all orders for a product
     */
    public function calculateOrderQuantity(Entity $entity): int
    {
        $productId = $entity->getId();
        if (!$productId) {
            return 0;
        }

        $statusesForCounting = $entity->get('orderStatusesForCounting');
        if (empty($statusesForCounting) || !is_array($statusesForCounting)) {
            $statusesForCounting = ['Confirmed', 'Processing', 'Shipped', 'Delivered'];
        }

        return $this->calculateQuantityFromEntity('Order', 'orderItems', $statusesForCounting, $productId);
    }

    /**
     * Calculate total quantity from all offers/quotes for a product
     */
    public function calculateQuoteQuantity(Entity $entity): int
    {
        $productId = $entity->getId();
        if (!$productId) {
            return 0;
        }

        $statusesForCounting = $entity->get('offerStatusesForCounting');
        if (empty($statusesForCounting) || !is_array($statusesForCounting)) {
            $statusesForCounting = ['Sent', 'Accepted'];
        }

        return $this->calculateQuantityFromEntity('Offer', 'offerItems', $statusesForCounting, $productId);
    }

    /**
     * Calculate quantities deducted from stock for a product
     */
    public function calculateStockDeduction(Entity $entity): int
    {
        $productId = $entity->getId();
        if (!$productId) {
            return 0;
        }

        $totalDeduction = 0;

        // Calculate deduction from orders
        $orderStatusesForDeduction = $entity->get('orderStatusesForStockDeduction');
        if (!empty($orderStatusesForDeduction) && is_array($orderStatusesForDeduction)) {
            $totalDeduction += $this->calculateQuantityFromEntity('Order', 'orderItems', $orderStatusesForDeduction, $productId);
        }

        // Calculate deduction from offers
        $offerStatusesForDeduction = $entity->get('offerStatusesForStockDeduction');
        if (!empty($offerStatusesForDeduction) && is_array($offerStatusesForDeduction)) {
            $totalDeduction += $this->calculateQuantityFromEntity('Offer', 'offerItems', $offerStatusesForDeduction, $productId);
        }

        return $totalDeduction;
    }

    /**
     * Calculate available stock quantity (stockQuantity - deductions)
     */
    public function calculateAvailableStockQuantity(Entity $entity): int
    {
        $stockQuantity = (int) ($entity->get('stockQuantity') ?? 0);
        $stockDeduction = $this->calculateStockDeduction($entity);
        
        return max(0, $stockQuantity - $stockDeduction);
    }

    /**
     * Get product with default status configurations only if not set
     */
    private function getProductWithDefaults(string $productId): ?Entity
    {
        $product = $this->entityManager->getEntity('ProductsItems', $productId);
        
        if (!$product) {
            return null;
        }

        // Only set defaults for completely new products (no saved values)
        $isNew = !$product->getId() || $product->isNew();
        
        if ($isNew) {
            if ($product->get('orderStatusesForCounting') === null) {
                $product->set('orderStatusesForCounting', ['Confirmed', 'Processing', 'Shipped', 'Delivered']);
            }
            
            if ($product->get('offerStatusesForCounting') === null) {
                $product->set('offerStatusesForCounting', ['Sent', 'Accepted']);
            }
            
            if ($product->get('orderStatusesForStockDeduction') === null) {
                $product->set('orderStatusesForStockDeduction', ['Shipped', 'Delivered']);
            }
            
            if ($product->get('offerStatusesForStockDeduction') === null) {
                $product->set('offerStatusesForStockDeduction', []);
            }
        }

        return $product;
    }

    /**
     * Update calculated fields for a product
     */
    public function updateCalculatedFields(string $productId): void
    {
        $product = $this->getProductWithDefaults($productId);
        
        if (!$product) {
            return;
        }

        $orderQuantity = $this->calculateOrderQuantity($product);
        $quoteQuantity = $this->calculateQuoteQuantity($product);
        $availableStockQuantity = $this->calculateAvailableStockQuantity($product);

        $product->set([
            'orderQuantity' => $orderQuantity,
            'quoteQuantity' => $quoteQuantity,
            'availableStockQuantity' => $availableStockQuantity
        ]);

        $this->entityManager->saveEntity($product, [
            'skipHooks' => true,
            'silent' => true,
            'skipCalculation' => true
        ]);
    }

    /**
     * Recalculate quantities for all products with batch processing
     */
    public function recalculateAllQuantities(int $batchSize = 100): void
    {
        $repository = $this->entityManager->getRDBRepository('ProductsItems');
        $offset = 0;
        
        do {
            $products = $repository
                ->limit($offset, $batchSize)
                ->find();
                
            foreach ($products as $product) {
                $this->updateCalculatedFields($product->getId());
            }
            
            $offset += $batchSize;
            
            // Clear memory to prevent memory exhaustion
            $this->entityManager->clear();
            
        } while (count($products) === $batchSize);
    }

    /**
     * Override beforeSave to calculate quantities
     */
    public function beforeSave(Entity $entity, array $options = []): void
    {
        parent::beforeSave($entity, $options);

        // Only apply defaults for new entities that don't have values set
        $isNew = !$entity->getId() || $entity->isNew();
        
        if ($isNew) {
            if ($entity->get('orderStatusesForCounting') === null) {
                $entity->set('orderStatusesForCounting', ['Confirmed', 'Processing', 'Shipped', 'Delivered']);
            }
            if ($entity->get('offerStatusesForCounting') === null) {
                $entity->set('offerStatusesForCounting', ['Sent', 'Accepted']);
            }
            if ($entity->get('orderStatusesForStockDeduction') === null) {
                $entity->set('orderStatusesForStockDeduction', ['Shipped', 'Delivered']);
            }
            if ($entity->get('offerStatusesForStockDeduction') === null) {
                $entity->set('offerStatusesForStockDeduction', []);
            }
        }

        // Calculate quantities only if explicitly requested or for configuration changes
        if (empty($options['skipCalculation']) && empty($options['skipHooks'])) {
            $configFields = [
                'orderStatusesForCounting',
                'offerStatusesForCounting', 
                'orderStatusesForStockDeduction',
                'offerStatusesForStockDeduction'
            ];
            
            $shouldCalculateAll = $isNew;
            $shouldCalculateAvailable = false;
            
            // Check if any configuration field changed
            if (!$isNew) {
                foreach ($configFields as $field) {
                    if ($entity->isAttributeChanged($field)) {
                        $shouldCalculateAll = true;
                        break;
                    }
                }
                
                // Check if stockQuantity changed - only recalculate availableStockQuantity
                if ($entity->isAttributeChanged('stockQuantity')) {
                    $shouldCalculateAvailable = true;
                }
            }
            
            if ($shouldCalculateAll) {
                // Full recalculation
                $orderQuantity = $this->calculateOrderQuantity($entity);
                $quoteQuantity = $this->calculateQuoteQuantity($entity);
                $availableStockQuantity = $this->calculateAvailableStockQuantity($entity);
                
                $entity->set('orderQuantity', $orderQuantity);
                $entity->set('quoteQuantity', $quoteQuantity);
                $entity->set('availableStockQuantity', $availableStockQuantity);
            } elseif ($shouldCalculateAvailable) {
                // Only recalculate available stock when stockQuantity changes
                $availableStockQuantity = $this->calculateAvailableStockQuantity($entity);
                $entity->set('availableStockQuantity', $availableStockQuantity);
            }
        }
    }

    /**
     * Override afterSave to recalculate if needed
     */
    public function afterSave(Entity $entity, array $options = []): void
    {
        parent::afterSave($entity, $options);

        // Recalculate if this was a configuration change
        if (empty($options['skipCalculation']) && empty($options['skipHooks'])) {
            $configFields = [
                'orderStatusesForCounting',
                'offerStatusesForCounting', 
                'orderStatusesForStockDeduction',
                'offerStatusesForStockDeduction'
            ];
            
            $needsFullRecalc = false;
            foreach ($configFields as $field) {
                if ($entity->isAttributeChanged($field)) {
                    $needsFullRecalc = true;
                    break;
                }
            }
            
            if ($needsFullRecalc) {
                $this->updateCalculatedFields($entity->getId());
            }
            // Note: stockQuantity changes are handled in beforeSave, no need for afterSave processing
        }
    }
}