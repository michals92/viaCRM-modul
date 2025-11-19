<?php

namespace Espo\Modules\Autocrm\Classes\AppParams;

use Espo\Modules\Autocrm\Tools\ManualWorkflow\Service as ManualWorkflowService;
use Espo\Tools\App\AppParam;
use stdClass;

class ManualWorkflows implements AppParam {

	public function __construct(
		private readonly ManualWorkflowService $manualWorkflowService
	) {}

	public function get(): stdClass {
		return $this->manualWorkflowService->get();
	}

}
