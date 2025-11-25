<?php

namespace Espo\Modules\Viacrm\Tools\NavbarAction\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;

class ClearBrowserCache implements Action {

	public function process(Request $request): Response {
		$response = ResponseComposer::json([
		    'success' => true
		]);

		$response->addHeader('Clear-Site-Data', 'cache');

		return $response;
	}

}
