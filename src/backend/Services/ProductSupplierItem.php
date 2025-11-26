<?php

namespace Espo\Modules\Viacrm\Services;

use Espo\Modules\Viacrm\Entities\Product;
use Espo\Modules\Viacrm\Entities\ProductSupplierItem as ProductSupplierItemEntity;
use Espo\Services\Record;

/**
 * @extends Record<ProductSupplierItemEntity>
 */
class ProductSupplierItem extends Record {
	/**
	 * Get the product associated with this supplier item.
	 */
	public function getProduct(ProductSupplierItemEntity $supplierItem): ?Product {
		$product = $this->entityManager
		    ->getRelation($supplierItem, 'product')
		    ->findOne();

		/** @var ?Product $product */
		return $product;
	}
}
