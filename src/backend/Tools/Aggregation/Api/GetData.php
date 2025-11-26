<?php

namespace Espo\Modules\Viacrm\Tools\Aggregation\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;
use Espo\Modules\Viacrm\Tools\Aggregation\Params as AggregationParams;
use Espo\Modules\Viacrm\Tools\Aggregation\Service as AggregationService;

class GetData implements Action {
	public function __construct(
		private readonly AggregationService $aggregationService,
	) {}

	/**
	 * @throws BadRequest
	 * @throws NotFound
	 */
	public function process(Request $request): Response {
		$scope = $request->getRouteParam('scope');
		$rawParams = $this->prepareParams($request->getQueryParams());

		$params = AggregationParams::fromRaw($rawParams, $scope);

		return ResponseComposer::json($this->aggregationService->aggregate($params));
	}

	/**
	 * @param  array<string, mixed> $requestParams
	 * @throws BadRequest
	 * @return array<string, mixed>
	 */
	private function prepareParams(array $requestParams): array {
		$select = explode(',', $requestParams['select'] ?? '');

		if ($select === ['']) {
			throw new BadRequest('No select.');
		}

		$params = [
			'entries' => [],
		];

		foreach ($select as $item) {
			$parts = explode('_', $item);
			$function = array_pop($parts);
			$field = implode('_', $parts);

			if (!$field || !$function) {
				throw new BadRequest('Bad select.');
			}

			$params['entries'][] = [
				'function' => $function,
				'field' => $field,
				'name' => $item,
			];
		}

		if (isset($requestParams['where'])) {
			$params['where'] = $requestParams['where'];
		}

		return $params;
	}
}
