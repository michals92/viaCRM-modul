<?php

namespace Espo\Modules\Autocrm\Tools\DynamicLogic;

use Espo\ORM\Query\SelectBuilder as QueryBuilder;

interface ConditionConverter {

	/**
	 * Convert a dynamic logic condition to query parameters.
	 *
	 * @param  QueryBuilder              $queryBuilder The query builder instance
	 * @param  array<string, mixed>      $condition    The condition data to convert
	 * @param  array<string, mixed>      $options      The options for conversion
	 * @return array<string, mixed>|null Converted condition or null if not applicable
	 */
	public function convert(QueryBuilder $queryBuilder, array $condition, array $options): null|array;

}