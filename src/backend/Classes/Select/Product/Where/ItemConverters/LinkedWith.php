<?php

namespace Espo\Modules\Viacrm\Classes\Select\Product\Where\ItemConverters;

use Espo\Core\Select\Where\Item;
use Espo\Core\Select\Where\ItemConverter;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\Part\Expression as Expr;
use Espo\ORM\Query\Part\WhereItem as WhereClauseItem;
use Espo\ORM\Query\SelectBuilder as QueryBuilder;

/**
 * LinkedWith ItemConverter for Product entity.
 *
 * Handles filtering Products by their linked Accounts (suppliers)
 * through the ProductSupplierItem intermediate entity.
 * Used when searching Products by accounts relation.
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
		$accountIds = is_array($value) ? $value : [$value];

		return $this->convertAccountsLinkedWith($accountIds);
	}

	/**
	 * Filter Products by linked Accounts (suppliers) through ProductSupplierItem.
	 *
	 * @param array<mixed> $accountIds
	 */
	private function convertAccountsLinkedWith(array $accountIds): WhereClauseItem
	{
		// Subquery to find Product IDs that have ProductSupplierItems for the given Accounts
		$subQuery = QueryBuilder::create()
			->from('ProductSupplierItem')
			->select('productId')
			->where([
				'accountId' => $accountIds,
				'deleted' => false,
			])
			->build();

		return Cond::in(
			Expr::column('id'),
			$subQuery
		);
	}
}
