<?php

namespace Espo\Modules\Viacrm\Tools\ProductSupplier\Strategies;

use Espo\Core\Exceptions\Error;
use Espo\Modules\Viacrm\Entities\Product;
use Espo\Modules\Viacrm\Entities\ProductSupplierItem;
use Espo\Modules\Viacrm\Tools\ProductSupplier\Abstract\ProductSupplierStrategy;
use Espo\Modules\Viacrm\Tools\ProductSupplier\Abstract\ProductSupplierStrategyData;

/**
 * Strategy for selecting supplier items based on lowest price and delivery deadline.
 * This strategy chooses the supplier item with the lowest price that can deliver
 * within the deadline specified by the related entity.
 */
class LowestPriceWithDeadlineStrategy extends ProductSupplierStrategy
{
    /**
     * Get the supplier item with the lowest price that can deliver before the deadline.
     *
     * @param Product $product The product to find a supplier for
     *
     * @throws Error When a deadline is not specified in the related entity
     *
     * @return ProductSupplierItem|null The best supplier item or null if none found
     */
    public function getProductSupplierItem(Product $product): ?ProductSupplierItem
    {
        $supplierItems = $this->getProductSupplierItems($product);

        if (empty($supplierItems)) {
            return null;
        }

        $bestItem = null;
        $lowestPrice = PHP_FLOAT_MAX;
        $finalDate = $this->getDeadline();

        // Calculate days until deadline once, outside the loop
        $today = new \DateTime();
        $deadlineDate = new \DateTime($finalDate);

        // Check if deadline is in the future (invert=0 means deadline is in the future)
        $diff = $deadlineDate->diff($today);
        if ($diff->invert === 0 && ($diff->days > 0 || $diff->h > 0)) {
            // Deadline has passed, fall back to shortest delivery time
            return $this->getSupplierWithShortestDeliveryTime($supplierItems);
        }

        // Get actual days until deadline (not absolute value)
        $daysUntilDeadline = $diff->days;
        if ($daysUntilDeadline === false) {
            // If days calculation fails, fall back to shortest delivery time
            return $this->getSupplierWithShortestDeliveryTime($supplierItems);
        }

        // First, try to find suppliers that can meet the deadline
        foreach ($supplierItems as $item) {
            $price = $item->getCostPrice();
            if ($price === null) {
                continue; // Skip items with no price
            }

            // Check if supplier can meet the deadline using the helper method
            if (!$item->canMeetDeadline($daysUntilDeadline)) {
                continue;
            }

            // Among items that meet the deadline, pick the cheapest one
            if ($price < $lowestPrice) {
                $lowestPrice = $price;
                $bestItem = $item;
            }
        }

        // If no supplier can meet the deadline, fall back to shortest delivery time
        if ($bestItem === null) {
            return $this->getSupplierWithShortestDeliveryTime($supplierItems);
        }

        return $bestItem;
    }

    /**
     * Get the supplier with the shortest delivery time.
     *
     * @param ProductSupplierItem[] $supplierItems Array of supplier items
     *
     * @return ProductSupplierItem|null The supplier with shortest delivery time or null if none found
     */
    private function getSupplierWithShortestDeliveryTime(array $supplierItems): ?ProductSupplierItem
    {
        $bestItem = null;
        $shortestDeliveryTime = PHP_INT_MAX;

        foreach ($supplierItems as $item) {
            $deliveryTime = $item->getDeliveryTime();

            // If delivery time is not set, treat it as 0 (immediate delivery)
            if ($deliveryTime === null) {
                $deliveryTime = 0;
            }

            if ($deliveryTime < $shortestDeliveryTime) {
                $shortestDeliveryTime = $deliveryTime;
                $bestItem = $item;
            }
        }

        return $bestItem;
    }

    /**
     * Get the deadline date from the related entity.
     *
     * @throws Error When no deadline is specified in the related entity
     *
     * @return string The deadline date in string format
     */
    private function getDeadline(): string
    {
        // First check if related entity exists
        if ($this->relatedEntity === null) {
            if ($this->data[ProductSupplierStrategyData::DEADLINE] !== null) {
                return $this->data[ProductSupplierStrategyData::DEADLINE];
            }
            throw Error::createWithBody(
                'No related entity provided for deadline calculation',
                Error\Body::create()
                    ->withMessageTranslation(
                        'noRelatedEntityProvided',
                        Product::ENTITY_TYPE,
                        []
                    )
            );
        }

        // Then check if the deadline field exists
        $deadline = $this->relatedEntity->get('finalDate');
        if ($deadline) {
            return $deadline;
        }

        // Get the entity ID for the error message
        $relatedEntityId = $this->relatedEntity->getId();

        throw Error::createWithBody(
            'No deadline is specified',
            Error\Body::create()
                ->withMessageTranslation(
                    'noDeadlineSpecified',
                    Product::ENTITY_TYPE,
                    ['relatedEntityId' => $relatedEntityId]
                )
        );
    }
}
