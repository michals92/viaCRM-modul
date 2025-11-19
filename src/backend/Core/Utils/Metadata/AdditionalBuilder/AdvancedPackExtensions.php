<?php

namespace Espo\Modules\Autocrm\Core\Utils\Metadata\AdditionalBuilder;

use Espo\Core\Utils\Metadata\AdditionalBuilder;
use stdClass;

/** The purpose of this class is to add Advanced Pack specific enhancements to the Workflow entityDefs,
 *  but only if the Workflow entity already exists (i.e. Advanced Pack is installed)
 */
class AdvancedPackExtensions implements AdditionalBuilder {

	public function build(stdClass $data): void {
		if (isset($data->entityDefs->Workflow)) {
			$data->entityDefs->Workflow->fields->manualStyle = [
			    'type' => 'enum',
			    'options' => ['default', 'success', 'danger', 'warning', 'info', 'primary'],
			    'style' => [
			        'default' => 'default',
			        'success' => 'success',
			        'danger' => 'danger',
			        'warning' => 'warning',
			        'info' => 'info',
			        'primary' => 'primary'
			    ],
			    'default' => 'default',
			    'view' => 'views/fields/enum'
			];

			// Add tooltip support to manualElementType field
			$data->entityDefs->Workflow->fields->manualElementType ??= (object)[];
			$data->entityDefs->Workflow->fields->manualElementType->tooltip = true;

			if ($actions = $data->app->workflowActions) {
				$data->entityDefs->Workflow->actionViews ??= (object)[];
				$data->entityDefs->Workflow->actionModals ??= (object)[];

				foreach ($actions as $actionName => $actionData) {
					$data->clientDefs->BpmnFlowchart->elements->task->fields->actions->actionTypeList[] = $actionName;
					$data->entityDefs->Workflow->actionList[] = $actionName;

					if (isset($actionData->view)) {
						$data->entityDefs->Workflow->actionViews->{$actionName} = $actionData->view;
					}

					if (isset($actionData->modalView)) {
						$data->entityDefs->Workflow->actionModals->{$actionName} = $actionData->modalView;
					}
				}
			}
		}
	}

}
