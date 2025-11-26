<?php

namespace Espo\Modules\Viacrm\Core\Email;

use Espo\Core\Api\Request;

class ReadParamsFetcher extends \Espo\Core\Record\ReadParamsFetcher {
	public function fetch(Request $request): ReadParams {
		return ReadParams::create()
			->setReadType(
				$request->getQueryParam('readType')
			);
	}
}