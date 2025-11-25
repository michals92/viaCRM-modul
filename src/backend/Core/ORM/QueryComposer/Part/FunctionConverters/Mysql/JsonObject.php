<?php

namespace Espo\Modules\Viacrm\Core\ORM\QueryComposer\Part\FunctionConverters\Mysql;

use Espo\ORM\QueryComposer\Part\FunctionConverter;

class JsonObject implements FunctionConverter {

	public function convert(string ...$argumentList): string {
		$string = 'JSON_OBJECT(';

		foreach ($argumentList as $argument) {
			$string .= $argument . ', ';
		}

		$string = rtrim($string, ', ');

		return $string . ')';
	}

}
