<?php

namespace Espo\Modules\Autocrm\Core\ORM\QueryComposer\Part\FunctionConverters\Postgresql;

use Espo\ORM\QueryComposer\Part\FunctionConverter;

class JsonObject implements FunctionConverter {

	public function convert(string ...$argumentList): string {
		$string = 'jsonb_build_object(';

		foreach ($argumentList as $argument) {
			$string .= $argument . ', ';
		}

		$string = rtrim($string, ', ');

		return $string . ')';
	}

}
