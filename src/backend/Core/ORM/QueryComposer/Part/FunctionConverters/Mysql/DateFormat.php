<?php

namespace Espo\Modules\Viacrm\Core\ORM\QueryComposer\Part\FunctionConverters\Mysql;

use Espo\ORM\QueryComposer\Part\FunctionConverter;

class DateFormat implements FunctionConverter {

	public function convert(string ...$argumentList): string {
		if (count($argumentList) !== 2) {
			throw new \InvalidArgumentException('DateFormat function requires exactly two arguments: date, format.');
		}

		[$date, $format] = $argumentList;

		return "IFNULL(DATE_FORMAT($date, $format), $date)";
	}

}
