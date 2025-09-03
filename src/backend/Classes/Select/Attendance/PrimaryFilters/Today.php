<?php
namespace Espo\Modules\ViaCrm\Classes\Select\Attendance\PrimaryFilters;

use Espo\Core\Select\Primary\Filter;
use Espo\ORM\Query\SelectBuilder;
use Espo\ORM\Query\Part\Condition as Cond;

class Today implements Filter
{
    public function apply(SelectBuilder $queryBuilder): void
    {
        $queryBuilder->where(
            Cond::and(
                Cond::greaterOrEqual(
                    Cond::column('arrivalDate'),
                    date('Y-m-d 00:00:00')
                ),
                Cond::less(
                    Cond::column('arrivalDate'),
                    date('Y-m-d 23:59:59', strtotime('+1 day'))
                )
            )
        );
    }
}