<?php

namespace Espo\Modules\Viacrm\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Utils\Log;
use Espo\Modules\Viacrm\Tools\ZiveFirmy\IntegrationProxy;
use Espo\Modules\Viacrm\Tools\ZiveFirmy\Service as ZiveFirmyService;

class ZiveFirmy implements Action {
	public function __construct(
		private readonly ZiveFirmyService $ziveFirmyService,
		private readonly IntegrationProxy $integrationProxy,
		private readonly Log $log
	) {}

	public function process(Request $request): Response {
		$sicCode = $request->getRouteParam('sicCode');

		if (!$sicCode) {
			throw new BadRequest('SIC code is required');
		}

		try {
			$token = $this->integrationProxy->getToken();
			$info = $this->ziveFirmyService->getInfo($sicCode, $token);

			return ResponseComposer::json($info);
		} catch (\Exception $e) {
			$this->log->error('Error fetching ZiveFirmy info: ' . $e->getMessage());

			$fallbackResponse = [
			    'ICO' => $sicCode,
			    'FIRMA' => '',
			    'PFORMA' => '',
			    'ADRESA' => '',
			    'ULICE' => '',
			    'CISLO' => '',
			    'CAST_OBCE' => '',
			    'OBEC' => '',
			    'PSC' => '',
			    'Obrat' => [],
			    'PocetZamestnancu' => []
			];

			return ResponseComposer::json($fallbackResponse);
		}
	}
}
