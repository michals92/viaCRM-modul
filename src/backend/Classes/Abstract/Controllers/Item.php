<?php

namespace Espo\Modules\Viacrm\Classes\Abstract\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\Forbidden;
use stdClass;

class Item extends \Espo\Core\Templates\Controllers\Base {
	public function postActionCreate(Request $request, Response $response): stdClass {
		throw new Forbidden();
	}

	/**
	 * @throws Forbidden
	 */
	public function actionCreate(mixed $params, mixed $data, mixed $request): mixed {
		throw new Forbidden();
	}
}
