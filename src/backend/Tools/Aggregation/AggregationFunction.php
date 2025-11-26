<?php

namespace Espo\Modules\Viacrm\Tools\Aggregation;

use Espo\ORM\Query\SelectBuilder;

interface AggregationFunction
{
	public function aggregate(string $name, string $function, string $field, SelectBuilder $queryBuilder): void;
}
