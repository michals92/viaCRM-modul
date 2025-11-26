<?php

namespace Espo\Modules\Viacrm\Classes\TemplateHelpers;

use Espo\Core\Htmlizer\Helper;
use Espo\Core\Htmlizer\Helper\Data;
use Espo\Core\Htmlizer\Helper\Result;

class StartsWith implements Helper {
	public function render(Data $data): Result {
		$argumentList = $data->getArgumentList();

		$string = $argumentList[0] ?? '';
		$prefix = $argumentList[1] ?? '';

		if (!is_string($string) || !is_string($prefix)) {
			return Result::createEmpty();
		}

		if (strpos($string, $prefix) === 0) {
			return Result::createSafeString('true');
		}

		return Result::createEmpty();
	}
}