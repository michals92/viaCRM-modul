<?php

namespace Espo\Modules\Viacrm\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\Error;
use Espo\Core\Record\SearchParamsFetcher;
use Espo\Modules\Viacrm\Tools\WorkQueue\Service as WorkQueueService;
use stdClass;

class WorkQueue {
	public function __construct(
		protected readonly SearchParamsFetcher $searchParamsFetcher,
		protected readonly WorkQueueService $workQueueService,
	) {}

	public static string $defaultAction = 'list';

	/**
	 * @throws Error
	 */
	public function getActionList(Request $request, Response $response): stdClass {
		$searchParams = $this->searchParamsFetcher->fetch($request);

		$result = $this->workQueueService->getData($searchParams);

		$list = [];

		foreach ($result->getGroups() as $group) {
			$list = [...$list, ...$group->collection->getValueMapList()];
		}

		return (object)[
			'total' => $result->getTotal(),
			'groups' => array_map(
				static fn($it) => $it->toRaw(),
				$result->getGroups()
			),
			'list' => $list,
		];
	}
}
