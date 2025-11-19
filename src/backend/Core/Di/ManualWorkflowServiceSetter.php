<?php

namespace Espo\Modules\Autocrm\Core\Di;

use Espo\Modules\Autocrm\Tools\ManualWorkflow\Service as ManualWorkflowService;

trait ManualWorkflowServiceSetter {

	protected ManualWorkflowService $manualWorkflowService;

	public function setManualWorkflowService(ManualWorkflowService $manualWorkflowService): void {
		$this->manualWorkflowService = $manualWorkflowService;
	}

}
