<?php
namespace Espo\Modules\ViaCrm\Classes\Select\Attendance\PrimaryFilters;

use Espo\Core\Select\Primary\Filter;
use Espo\ORM\Query\SelectBuilder;
use Espo\ORM\Query\Part\Condition as Cond;

class ThisWeek implements Filter
{
    public function apply(SelectBuilder $queryBuilder): void
    {
        $startOfWeek = date('Y-m-d 00:00:00', strtotime('monday this week'));
        $endOfWeek = date('Y-m-d 23:59:59', strtotime('sunday this week'));
        
        $queryBuilder->where(
            Cond::and(
                Cond::greaterOrEqual(
                    Cond::column('arrivalDate'),
                    $startOfWeek
                ),
                Cond::lessOrEqual(
                    Cond::column('arrivalDate'),
                    $endOfWeek
                )
            )
        );
    }
}