<?php

namespace Espo\Modules\Viacrm\Api\Partition;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Record\SearchParamsFetcher;
use Espo\Modules\Viacrm\Tools\Partition\PartitionService;

class GetData implements Action {

	public function __construct(
		private readonly PartitionService $partitionService,
		private readonly SearchParamsFetcher $searchParamsFetcher
	) {}

	/**
	 * @throws BadRequest
	 * @throws Forbidden|Error
	 */
	public function process(Request $request): Response {
		$entityType = $request->getRouteParam('entityType');
		$by = $request->getRouteParam('by');

		if (!$entityType || !$by) {
			throw new BadRequest();
		}

		$searchParams = $this->searchParamsFetcher->fetch($request);
		$result = $this->partitionService->getData($entityType, $searchParams, $by);

		// Kanban (which is the basis for partitions) got reworked in 8.4.0 
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