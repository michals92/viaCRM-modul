<?php

namespace Espo\Modules\Viacrm\Tools\Ares\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Modules\Viacrm\Tools\Ares\Service as AresService;

class GetFillData implements Action {
	public function __construct(
		private readonly AresService $aresService,
	) {}

	/**
	 * @throws BadRequest
	 * @throws \JsonException
	 * @throws Error
	 */
	public function process(Request $request): Response {
		$sicCode = $request->getRouteParam('sicCode');

		if (empty($sicCode)) {
			throw new BadRequest('Missing SIC code');
		}

		$data = $this->aresService->getDataBySicCode($sicCode);

		return ResponseComposer::json([
			'attributes' => $data,
		]);
	}
}
