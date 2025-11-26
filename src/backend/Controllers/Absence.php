<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Templates\Controllers\Base;

class Absence extends Base {
	public function actionApprove(Request $request): \stdClass {
		$id = $request->getRouteParam('id');
        
		if (!$id) {
			throw new BadRequest('ID is required');
		}

		$data = $request->getParsedBody();
		$comment = $data->approverComment ?? null;

		return $this->getRecordService()->approve($id, $comment);
	}

	public function actionReject(Request $request): \stdClass {
		$id = $request->getRouteParam('id');
        
		if (!$id) {
			throw new BadRequest('ID is required');
		}

		$data = $request->getParsedBody();
		$comment = $data->approverComment ?? null;

		if (!$comment) {
			throw new BadRequest('Approver comment is required for rejection');
		}

		return $this->getRecordService()->reject($id, $comment);
	}

	public function actionCancel(Request $request): \stdClass {
		$id = $request->getRouteParam('id');
        
		if (!$id) {
			throw new BadRequest('ID is required');
		}

		return $this->getRecordService()->cancel($id);
	}

	public function actionMyRequests(Request $request): \stdClass {
		$searchParams = $this->fetchSearchParamsFromRequest($request);
        
		return $this->getRecordService()->getMyRequests($searchParams);
	}

	public function actionPendingApprovals(Request $request): \stdClass {
		$searchParams = $this->fetchSearchParamsFromRequest($request);
        
		return $this->getRecordService()->getPendingApprovals($searchParams);
	}

	public function actionCalculateDays(Request $request): \stdClass {
		$data = $request->getParsedBody();
        
		if (!isset($data->startDate) || !isset($data->endDate)) {
			throw new BadRequest('Start date and end date are required');
		}

		$days = $this->getRecordService()->calculateWorkingDays(
			$data->startDate,
			$data->endDate
		);

		return (object) ['days' => $days];
	}
}