<?php

namespace Espo\Modules\ViaCrm\Classes\Select\Absence\PrimaryFilters;

use Espo\Core\Select\Primary\Filter;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\SelectBuilder;

class Pending implements Filter {
	public function apply(SelectBuilder $queryBuilder): void {
		$queryBuilder->where(
			Cond::equal(
				Cond::column('status'),
				'pending'
			)
		);
	}
}