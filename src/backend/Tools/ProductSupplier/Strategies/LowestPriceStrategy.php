<?php

namespace Espo\Modules\Viacrm\Tools\ProductSupplier\Strategies;

use Espo\Core\Exceptions\Error;
use Espo\Modules\Viacrm\Entities\Product;
use Espo\Modules\Viacrm\Entities\ProductSupplierItem;
use Espo\Modules\Viacrm\Tools\ProductSupplier\Abstract\ProductSupplierStrategy;

/**
 * Strategy for selecting supplier items based on the lowest price.
 * This strategy simply chooses the supplier item with the lowest cost price.
 */
class LowestPriceStrategy extends ProductSupplierStrategy
{
	/**
	 * Get the supplier item with the lowest price for a product.
	 *
	 * @param Product $product The product to find a supplier for
	 *
	 * @throws Error When an error occurs during selection process
	 *
	 * @return ProductSupplierItem|null The supplier item with lowest price or null if none found
	 */
	public function getProductSupplierItem(Product $product): ?ProductSupplierItem
	{
		$supplierItems = $this->getProductSupplierItems($product);

		if (empty($supplierItems)) {
			return null;
		}

		$bestItem = null;
		$lowestPrice = PHP_FLOAT_MAX;

		foreach ($supplierItems as $item) {
			$price = $item->getCostPrice();
			if ($price !== null && $price < $lowestPrice) {
				$lowestPrice = $price;
				$bestItem = $item;
			}
		}

		return $bestItem;
	}
}
