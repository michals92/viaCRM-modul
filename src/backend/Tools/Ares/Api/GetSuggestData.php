<?php

namespace Espo\Modules\Autocrm\Tools\Ares\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Modules\Autocrm\Tools\Ares\Service as AresService;

class GetSuggestData implements Action {

	public function __construct(
		private readonly AresService $aresService,
	) {}

	/**
	 * @throws BadRequest
	 * @throws \JsonException
	 * @throws Error
	 */
	public function process(Request $request): Response {
		$companyName = $request->getRouteParam('companyName');

		if (empty($companyName)) {
			throw new BadRequest('Missing company name');
		}

		try {
			$data = $this->aresService->getDataByName($companyName);
		} catch (\Exception $e) {
			$data = (object)['pocetCelkem' => 0, 'ekonomickeSubjekty' => []];
		}

		return ResponseComposer::json($data);
	}

}
