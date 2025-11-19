<?php

namespace Espo\Modules\Autocrm\Core\Di;

use Espo\Modules\Autocrm\Tools\ManualWorkflow\Service as ManualWorkflowService;

interface ManualWorkflowServiceAware {

	public function setManualWorkflowService(ManualWorkflowService $manualWorkflowService): void;

}
