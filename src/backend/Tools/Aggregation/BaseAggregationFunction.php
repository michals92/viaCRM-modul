<?php

namespace Espo\Modules\Viacrm\Tools\Aggregation;

use Espo\Core\Exceptions\Error;
use Espo\Core\Utils\Metadata;
use Espo\ORM\Query\SelectBuilder;

class BaseAggregationFunction implements AggregationFunction
{
	public function __construct(
		private readonly Metadata $metadata,
	) {
	}

	/**
	 * @throws Error
	 */
	public function aggregate(string $name, string $function, string $field, SelectBuilder $queryBuilder): void
	{
		$databaseFunction = $this->metadata->get(['aggregationFunctions', $function, 'databaseFunction']);

		if (!$databaseFunction) {
			throw new Error('Database function not found for aggregation function "' . $function . '".');
		}

		$queryBuilder->select($databaseFunction . ':' . $field, $name);
	}
}
