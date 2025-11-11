<?php
namespace Espo\Custom\Hooks\CInventoryMovemant;

use Espo\Core\Hook\Hook\AfterSave;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Repository\Option\SaveOptions;

class UpdateProductStock implements AfterSave
{
    private EntityManager $entityManager;

    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function afterSave(Entity $entity, SaveOptions $options): void
    {
        // Get product, amount and movement type
        $productId = $entity->get('productId');
        $amount = $entity->get('amount');
        $movemantType = $entity->get('movemantType');

        // Skip if required data is missing
        if (!$productId || !$amount || !$movemantType) {
            return;
        }

        // Fetch the product
        $product = $this->entityManager->getEntity('ProductsItems', $productId);

        if (!$product) {
            return;
        }

        // Get current stock quantity
        $currentStock = $product->get('stockQuantity') ?? 0;

        // Calculate new stock based on movement type
        $newStock = $currentStock;

        if ($movemantType === 'receipt') {
            // Příjemka - add to stock
            $newStock = $currentStock + $amount;
        } elseif ($movemantType === 'Issu') {
            // Výdejka - subtract from stock
            $newStock = $currentStock - $amount;

            // Ensure stock doesn't go negative
            if ($newStock < 0) {
                $newStock = 0;
            }
        }

        // Update product stock quantity
        $product->set('stockQuantity', $newStock);

        // Save the product
        $this->entityManager->saveEntity($product);
    }
}