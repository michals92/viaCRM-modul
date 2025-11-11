<?php

namespace Espo\Custom\Hooks\CInventoryMovemant;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Hook\Hook\BeforeSave;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Repository\Option\SaveOptions;

class ValidateStockAvailability implements BeforeSave
{
    private EntityManager $entityManager;

    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function beforeSave(Entity $entity, SaveOptions $options): void
    {
        // Get product, amount and movement type
        $productId = $entity->get('productId');
        $amount = $entity->get('amount');
        $movemantType = $entity->get('movemantType');

        // Skip validation if it's not an issuance (výdejka)
        if ($movemantType !== 'Issu') {
            return;
        }

        // Skip validation if required data is missing
        if (!$productId || !$amount) {
            return;
        }

        // Fetch the product
        $product = $this->entityManager->getEntity('ProductsItems', $productId);

        if (!$product) {
            return;
        }

        // Get current stock quantity
        $currentStock = $product->get('stockQuantity') ?? 0;

        // Check if trying to issue more than available
        if ($amount > $currentStock) {
            $productName = $product->get('name') ?? 'Neznamy produkt';
            throw new BadRequest(
                "Nelze vydat {$amount} ks produktu '{$productName}'. Dostupne mnozstvi na sklade: {$currentStock} ks."
            );
        }
    }
}