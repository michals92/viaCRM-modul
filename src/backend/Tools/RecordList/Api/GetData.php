<?php

namespace Espo\Modules\Viacrm\Tools\RecordList\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Record\SearchParamsFetcher;
use Espo\Modules\Viacrm\Tools\RecordList\Service as RecordListService;

class GetData implements Action
{
	public function __construct(
		private readonly SearchParamsFetcher $searchParamsFetcher,
		private readonly RecordListService $service,
	) {
	}

	public function process(Request $request): Response
	{
		$scope = $request->getRouteParam('scope');
		$id = $request->getRouteParam('id');
		$link = $request->getRouteParam('link');

		if (!$scope || !$id || !$link) {
			throw new BadRequest();
		}

		$searchParams = $this->searchParamsFetcher->fetch($request);
		$recordCollection = $this->service->obtain($scope, $id, $link, $searchParams);

		return ResponseComposer::json([
			'total' => $recordCollection->getTotal(),
			'list' => $recordCollection->getValueMapList(),
		]);
	}
}
