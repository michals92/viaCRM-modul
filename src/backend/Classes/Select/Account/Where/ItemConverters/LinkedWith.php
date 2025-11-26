<?php

namespace Espo\Modules\Viacrm\Classes\Select\Account\Where\ItemConverters;

use Espo\Core\Select\Where\Item;
use Espo\Core\Select\Where\ItemConverter;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\Part\Expression as Expr;
use Espo\ORM\Query\Part\WhereItem as WhereClauseItem;
use Espo\ORM\Query\SelectBuilder as QueryBuilder;

/**
 * LinkedWith ItemConverter for Account entity.
 *
 * Handles filtering Accounts (suppliers) by their linked Products
 * through the ProductSupplierItem intermediate entity.
 *
 * This replaces the old product_suppliers middle table approach
 * with the new ProductSupplierItem entity-based relationship.
 */
class LinkedWith implements ItemConverter
{
	public function convert(QueryBuilder $queryBuilder, Item $item): WhereClauseItem
	{
		$value = $item->getValue();

		// Handle array values
		$productIds = is_array($value) ? $value : [$value];

		return $this->convertProductsLinkedWith($productIds);
	}

	/**
	 * Filter Accounts by linked Products through ProductSupplierItem.
	 *
	 * @param array<mixed> $productIds
	 */
	private function convertProductsLinkedWith(array $productIds): WhereClauseItem
	{
		// Subquery to find Account IDs that have ProductSupplierItems for the given Products
		$subQuery = QueryBuilder::create()
			->from('ProductSupplierItem')
			->select('accountId')
			->where([
				'productId' => $productIds,
				'deleted' => false,
			])
			->build();

		return Cond::in(
			Expr::column('id'),
			$subQuery
		);
	}
}
