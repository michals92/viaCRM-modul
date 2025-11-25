<?php

namespace Espo\Modules\Viacrm\Tools\ProductSupplier\Abstract;

use Espo\Core\Di;
use Espo\Core\Exceptions\Error;
use Espo\Core\ORM\Entity;
use Espo\Modules\Viacrm\Entities\Product;
use Espo\Modules\Viacrm\Entities\ProductSupplierItem;
use Espo\Modules\Viacrm\Tools\ProductSupplier\Result\SupplierGroup;
use Espo\ORM\EntityCollection;

/**
 * Abstract class for product supplier strategies.
 * Provides common functionality for different supplier selection strategies.
 */
abstract class ProductSupplierStrategy implements Di\EntityManagerAware
{
    use Di\EntityManagerSetter;

    /** @var array<string, array<ProductSupplierItem>> */
    private array $productSupplierItems = [];

    /** @var array<string> List of product IDs */
    private array $productsIds;

    /** @var EntityCollection<Product>|null */
    private EntityCollection|null $products = null;

    /** @var Entity|null Related entity for contextual information (e.g., for deadline-based strategies) */
    protected Entity|null $relatedEntity = null;

    /** @var array<string, mixed> */
    protected array $data = [];

    /**
     * @param EntityCollection<Product> $products Collection of products to process
     */
    public function withProducts(EntityCollection $products): self
    {
        if ($this->products !== null) {
            return $this;
        }

        $this->products = $products;
        $this->productsIds = array_column($this->products->getValueMapList(), 'id');

        return $this;
    }

    /**
     *
     * @param array<string, mixed> $data
     *
     * @return self
     */
    public function withData(array $data): self
    {
        $this->data = $data;

        return $this;
    }

    /**
     * Get the best supplier item for a product based on the strategy implementation.
     *
     * @param Product $product The product to find a supplier for
     *
     * @throws Error When an error occurs during selection process
     *
     * @return ProductSupplierItem|null The best supplier item or null if none found
     */
    abstract public function getProductSupplierItem(Product $product): ?ProductSupplierItem;

    /**
     * Associate a related entity with this strategy for contextual information.
     *
     * @param Entity $entity The related entity (e.g., purchaseOrder, quote) providing context
     *
     * @return self The current instance for method chaining
     */
    public function withRelatedEntity(Entity $entity): self
    {
        $this->relatedEntity = $entity;

        return $this;
    }

    /**
     * Group products by their suppliers.
     *
     * After finding the best supplier for each product using the strategy's selection criteria,
     * this method groups products that share the same supplier. This is useful for creating
     * purchase orders, organizing logistics, or generating supplier-based reports.
     *
     * @throws Error When an error occurs during selection process
     *
     * @return SupplierGroup Products grouped by supplier with references to supplier items
     */
    public function group(): SupplierGroup
    {
        $supplierGroup = new SupplierGroup();
        $alreadyGroupedProducts = [];

        if ($this->products === null) {
            return $supplierGroup;
        }

        foreach ($this->products as $product) {
            if (in_array($product->getId(), $alreadyGroupedProducts, true)) {
                continue;
            }

            $productSupplierItem = $this->getProductSupplierItem($product);

            if ($productSupplierItem === null) {
                $GLOBALS['log']->debug("ProductSupplierItem not found for product id {$product->getId()}");
                continue;
            }

            $supplierId = $productSupplierItem->getSupplierId();
            $supplierGroup->addProduct($supplierId, $product, $productSupplierItem);
            $alreadyGroupedProducts[] = $product->getId();
        }

        return $supplierGroup;
    }

    /**
     * Get all supplier items for a product.
     * Lazily loads supplier items for all products in the collection.
     *
     * @param Product $product The product to get supplier items for
     *
     * @return array<ProductSupplierItem> Array of supplier items for the product
     */
    public function getProductSupplierItems(Product $product): array
    {
        $productId = $product->getId();
        if (empty($this->productSupplierItems)) {
            /** @var EntityCollection<ProductSupplierItem> $productSupplierItems */
            $productSupplierItems = $this->entityManager
                ->getRDBRepository(ProductSupplierItem::ENTITY_TYPE)
                ->where(['productId' => $this->productsIds])
                ->find();

            $this->productSupplierItems = [];

            foreach ($productSupplierItems as $productSupplierItem) {
                $itemProductId = $productSupplierItem->get('productId');

                if (!isset($this->productSupplierItems[$itemProductId])) {
                    $this->productSupplierItems[$itemProductId] = [];
                }

                $this->productSupplierItems[$itemProductId][] = $productSupplierItem;
            }
        }

        return $this->productSupplierItems[$productId] ?? [];
    }
}

class ProductSupplierStrategyData
{
    public const DEADLINE = 'deadline';
}
