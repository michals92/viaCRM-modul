<?php
namespace Espo\Modules\ViaCrm\Classes\Select\Attendance\PrimaryFilters;

use Espo\Core\Select\Primary\Filter;
use Espo\ORM\Query\SelectBuilder;
use Espo\ORM\Query\Part\Condition as Cond;

class ThisMonth implements Filter
{
    public function apply(SelectBuilder $queryBuilder): void
    {
        $startOfMonth = date('Y-m-01 00:00:00');
        $endOfMonth = date('Y-m-t 23:59:59');
        
        $queryBuilder->where(
            Cond::and(
                Cond::greaterOrEqual(
                    Cond::column('arrivalDate'),
                    $startOfMonth
                ),
                Cond::lessOrEqual(
                    Cond::column('arrivalDate'),
                    $endOfMonth
                )
            )
        );
    }
}