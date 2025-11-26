<?php

namespace Espo\Modules\Viacrm\Core\ORM\QueryComposer\Part\FunctionConverters\Mysql;

use Espo\ORM\QueryComposer\Part\FunctionConverter;

class DateSub implements FunctionConverter {
	public function convert(string ...$argumentList): string {
		if (count($argumentList) !== 3) {
			throw new \InvalidArgumentException('DateSub function requires exactly three arguments: date, interval value, interval unit.');
		}

		[$date, $intervalValue, $intervalUnit] = $argumentList;

		$allowedUnits = [
		    'MICROSECOND', 'MILLISECOND', 'SECOND', 'MINUTE', 'HOUR',
		    'DAY', 'WEEK', 'MONTH', 'YEAR', 'DECADE', 'CENTURY', 'MILLENNIUM'
		];

		$intervalUnitUpper = strtoupper(trim($intervalUnit, "'"));

		if (!in_array($intervalUnitUpper, $allowedUnits, true)) {
			throw new \InvalidArgumentException("Invalid interval unit: $intervalUnit");
		}

		$dateUpper = strtoupper(trim($date, "'"));

		return "DATE_SUB($dateUpper, INTERVAL $intervalValue $intervalUnitUpper)";
	}
}
