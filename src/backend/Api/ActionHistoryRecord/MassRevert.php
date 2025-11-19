<?php

namespace Espo\Modules\Autocrm\Api\ActionHistoryRecord;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Record\ServiceContainer;
use Espo\Entities\ActionHistoryRecord;

class MassRevert implements Action {

	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly ServiceContainer $serviceContainer
	) {}

	public function process(Request $request): Response {
		$data = $request->getParsedBody();

		if (empty($data->idList)) {
			throw new BadRequest();
		}

		$actionHistoryRecords = $this
		    ->entityManager
		    ->getRDBRepository(ActionHistoryRecord::ENTITY_TYPE)
		    ->where('id', $data->idList)
		    ->where('action', 'delete')
		    ->find();

		$count = 0;

		foreach ($actionHistoryRecords as $actionHistoryRecord) {
			try {
				$this
				    ->serviceContainer
				    ->get($actionHistoryRecord->get('targetType'))
				    ->restoreDeleted($actionHistoryRecord->get('targetId'));

				$count++;
			} catch (\Exception) {
				// do nothing
			}
		}

		return ResponseComposer::json([
		    'count' => $count,
		]);
	}

}
