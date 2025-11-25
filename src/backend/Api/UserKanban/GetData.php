<?php

namespace Espo\Modules\Viacrm\Api\UserKanban;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Record\SearchParamsFetcher;
use Espo\Modules\Viacrm\Tools\UserKanban\Service as UserKanbanService;

class GetData implements Action {

	public function __construct(
		private readonly UserKanbanService $userKanbanService,
		private readonly SearchParamsFetcher $searchParamsFetcher
	) {}

	public function process(Request $request): Response {
		$entityType = $request->getRouteParam('entityType');

		if (!$entityType) {
			throw new BadRequest();
		}

		$searchParams = $this->searchParamsFetcher->fetch($request);
		$result = $this->userKanbanService->getData($entityType, $searchParams);

		$list = [];

		foreach ($result->getGroups() as $group) {
			$list = [...$list, ...$group->collection->getValueMapList()];
		}

		return ResponseComposer::json([
		    'total' => $result->getTotal(),
		    'groups' => array_map(fn($it) => $it->toRaw(), $result->getGroups()),
		    'list' => $list,
		]);
	}

}
