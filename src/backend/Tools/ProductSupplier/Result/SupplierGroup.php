<?php

namespace Espo\Modules\Viacrm\Tools\ProductSupplier\Result;

use Espo\Modules\Viacrm\Entities\Product;
use Espo\Modules\Viacrm\Entities\ProductSupplierItem;

/**
 * Class representing a group of products associated with a supplier.
 * Provides structured access to suppliers, their products, and the supplier items.
 */
class SupplierGroup {
	/** @var array<string, array<string, array<string, mixed>>> */
	private array $groupedProducts = [];

	/**
	 * Add a product to the supplier group.
	 *
	 * @param string              $supplierId   The ID of the supplier
	 * @param Product             $product      The product to add
	 * @param ProductSupplierItem $supplierItem The supplier item that links the product and supplier
	 *
	 * @return self For method chaining
	 */
	public function addProduct(string $supplierId, Product $product, ProductSupplierItem $supplierItem): self {
		if (!isset($this->groupedProducts[$supplierId])) {
			$this->groupedProducts[$supplierId] = [];
		}

		$productId = $product->getId();
		$this->groupedProducts[$supplierId][$productId] = [
		    'product' => $product,
		    'supplierItem' => $supplierItem,
		];

		return $this;
	}

	/**
	 * Get all supplier IDs in this group.
	 *
	 * @return array<string> Array of supplier IDs
	 */
	public function getSupplierIds(): array {
		return array_keys($this->groupedProducts);
	}

	/**
	 * Get all products for a specific supplier.
	 *
	 * @param string $supplierId The supplier ID
	 *
	 * @return array<Product> Array of products
	 */
	public function getProducts(string $supplierId): array {
		if (!isset($this->groupedProducts[$supplierId])) {
			return [];
		}

		return array_map(
			fn ($item) => $item['product'],
			$this->groupedProducts[$supplierId]
		);
	}

	/**
	 * Get the supplier item that links a product to a supplier.
	 *
	 * @param string $supplierId The supplier ID
	 * @param string $productId  The product ID
	 *
	 * @return ProductSupplierItem|null The supplier item or null if not found
	 */
	public function getSupplierItem(string $supplierId, string $productId): ?ProductSupplierItem {
		return $this->groupedProducts[$supplierId][$productId]['supplierItem'] ?? null;
	}

	/**
	 * Get all supplier items for a specific supplier.
	 *
	 * @param string $supplierId The supplier ID
	 *
	 * @return array<ProductSupplierItem> Array of supplier items
	 */
	public function getSupplierItems(string $supplierId): array {
		if (!isset($this->groupedProducts[$supplierId])) {
			return [];
		}

		return array_map(
			fn ($item) => $item['supplierItem'],
			$this->groupedProducts[$supplierId]
		);
	}

	/**
	 * Check if the group contains any products.
	 *
	 * @return bool True if the group is empty
	 */
	public function isEmpty(): bool {
		return empty($this->groupedProducts);
	}

	/**
	 * Get the raw data structure for custom processing.
	 *
	 * @return array<string, array<string, array<string, mixed>>> The raw data
	 */
	public function getRawData(): array {
		return $this->groupedProducts;
	}

	/**
	 * Convert to array in a simplified format for easy integration with existing code.
	 * Format: [supplierId => [product1, product2, ...]].
	 *
	 * @return array<string, array<Product>> Products grouped by supplier ID
	 */
	public function toArray(): array {
		$result = [];

		foreach ($this->groupedProducts as $supplierId => $products) {
			$result[$supplierId] = array_values(array_map(
				fn ($item) => $item['product'],
				$products
			));
		}

		return $result;
	}
}
