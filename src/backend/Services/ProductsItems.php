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

        $orderRepository = $this->entityManager->getRDBRepository('Order');
        
        // Get all orders that are not cancelled or refunded
        $orders = $orderRepository
            ->where([
                'status!=' => ['Cancelled', 'Refunded']
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

        $offerRepository = $this->entityManager->getRDBRepository('Offer');
        
        // Get all offers that are not rejected or expired
        $offers = $offerRepository
            ->where([
                'status!=' => ['Rejected', 'Expired']
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
     * Update calculated fields for a product
     */
    public function updateCalculatedFields(string $productId): void
    {
        $product = $this->entityManager->getEntity('ProductsItems', $productId);
        
        if (!$product) {
            return;
        }

        $orderQuantity = $this->calculateOrderQuantity($product);
        $quoteQuantity = $this->calculateQuoteQuantity($product);

        $product->set([
            'orderQuantity' => $orderQuantity,
            'quoteQuantity' => $quoteQuantity
        ]);

        $this->entityManager->saveEntity($product, [
            'skipHooks' => true,
            'silent' => true
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

        // Only calculate if not explicitly skipped
        if (empty($options['skipCalculation'])) {
            if ($entity->getId()) {
                $entity->set('orderQuantity', $this->calculateOrderQuantity($entity));
                $entity->set('quoteQuantity', $this->calculateQuoteQuantity($entity));
            }
        }
    }
}