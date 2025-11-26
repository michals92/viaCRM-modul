<?php

namespace Espo\Modules\Viacrm\Tools\Aggregation;

use Espo\ORM\Query\Select;
use Espo\ORM\Query\SelectBuilder;

abstract class FakeAggregationFunction implements AggregationFunction {
	public function aggregate(string $name, string $function, string $field, SelectBuilder $queryBuilder): void {
		$value = addslashes($this->getAggregationResult($function, $field, $queryBuilder->build()));
		$queryBuilder->select('"' . $value . '"', $name);
	}

	abstract protected function getAggregationResult(string $function, string $field, Select $queryBuilder): string;
}
