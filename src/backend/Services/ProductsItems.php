<?php

namespace Espo\Modules\ViaCrm\Services;

use Espo\Services\Record;
use Espo\ORM\Entity;

class ProductsItems extends Record
{
    /**
     * Calculate total quantity from all orders for a product
     */
    public function calculateOrderQuantity(Entity $entity): int
    {
        $productId = $entity->getId();
        if (!$productId) {
            return 0;
        }

        // Get configured statuses for counting
        $statusesForCounting = $entity->get('orderStatusesForCounting');
        if (empty($statusesForCounting) || !is_array($statusesForCounting)) {
            // Default statuses if not configured
            $statusesForCounting = ['Confirmed', 'Processing', 'Shipped', 'Delivered'];
        }

        $orderRepository = $this->entityManager->getRDBRepository('Order');
        
        // Get orders with configured statuses
        $orders = $orderRepository
            ->where([
                'status' => $statusesForCounting
            ])
            ->find();

        $totalQuantity = 0;

        foreach ($orders as $order) {
            $orderItems = $order->get('orderItems');
            
            if (empty($orderItems)) {
                continue;
            }

            // Convert to array if it's an object
            if (is_object($orderItems)) {
                $orderItems = json_decode(json_encode($orderItems), true);
            }
            
            if (!is_array($orderItems)) {
                continue;
            }

            foreach ($orderItems as $item) {
                // Handle both array and object notation
                $itemArray = is_object($item) ? (array) $item : $item;
                
                if (isset($itemArray['productId']) && $itemArray['productId'] === $productId) {
                    $totalQuantity += (int) ($itemArray['quantity'] ?? 0);
                }
            }
        }

        return $totalQuantity;
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

        // Get configured statuses for counting
        $statusesForCounting = $entity->get('offerStatusesForCounting');
        if (empty($statusesForCounting) || !is_array($statusesForCounting)) {
            // Default statuses if not configured
            $statusesForCounting = ['Sent', 'Accepted'];
        }

        $offerRepository = $this->entityManager->getRDBRepository('Offer');
        
        // Get offers with configured statuses
        $offers = $offerRepository
            ->where([
                'status' => $statusesForCounting
            ])
            ->find();

        $totalQuantity = 0;

        foreach ($offers as $offer) {
            $offerItems = $offer->get('offerItems');
            
            if (empty($offerItems)) {
                continue;
            }

            // Convert to array if it's an object
            if (is_object($offerItems)) {
                $offerItems = json_decode(json_encode($offerItems), true);
            }
            
            if (!is_array($offerItems)) {
                continue;
            }

            foreach ($offerItems as $item) {
                // Handle both array and object notation
                $itemArray = is_object($item) ? (array) $item : $item;
                
                if (isset($itemArray['productId']) && $itemArray['productId'] === $productId) {
                    $totalQuantity += (int) ($itemArray['quantity'] ?? 0);
                }
            }
        }

        return $totalQuantity;
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
            $orderRepository = $this->entityManager->getRDBRepository('Order');
            
            $orders = $orderRepository
                ->where([
                    'status' => $orderStatusesForDeduction
                ])
                ->find();

            foreach ($orders as $order) {
                $orderItems = $order->get('orderItems');
                
                if (empty($orderItems)) {
                    continue;
                }

                // Convert to array if it's an object
                if (is_object($orderItems)) {
                    $orderItems = json_decode(json_encode($orderItems), true);
                }
                
                if (!is_array($orderItems)) {
                    continue;
                }

                foreach ($orderItems as $item) {
                    // Handle both array and object notation
                    $itemArray = is_object($item) ? (array) $item : $item;
                    
                    if (isset($itemArray['productId']) && $itemArray['productId'] === $productId) {
                        $totalDeduction += (int) ($itemArray['quantity'] ?? 0);
                    }
                }
            }
        }

        // Calculate deduction from offers
        $offerStatusesForDeduction = $entity->get('offerStatusesForStockDeduction');
        if (!empty($offerStatusesForDeduction) && is_array($offerStatusesForDeduction)) {
            $offerRepository = $this->entityManager->getRDBRepository('Offer');
            
            $offers = $offerRepository
                ->where([
                    'status' => $offerStatusesForDeduction
                ])
                ->find();

            foreach ($offers as $offer) {
                $offerItems = $offer->get('offerItems');
                
                if (empty($offerItems)) {
                    continue;
                }

                // Convert to array if it's an object
                if (is_object($offerItems)) {
                    $offerItems = json_decode(json_encode($offerItems), true);
                }
                
                if (!is_array($offerItems)) {
                    continue;
                }

                foreach ($offerItems as $item) {
                    // Handle both array and object notation
                    $itemArray = is_object($item) ? (array) $item : $item;
                    
                    if (isset($itemArray['productId']) && $itemArray['productId'] === $productId) {
                        $totalDeduction += (int) ($itemArray['quantity'] ?? 0);
                    }
                }
            }
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
     * Recalculate quantities for all products
     */
    public function recalculateAllQuantities(): void
    {
        $products = $this->entityManager
            ->getRDBRepository('ProductsItems')
            ->find();

        foreach ($products as $product) {
            $this->updateCalculatedFields($product->getId());
        }
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