<?php

namespace Espo\Modules\Viacrm\Core\Utils\Metadata\AdditionalBuilder;

use Espo\Core\Utils\Metadata\AdditionalBuilder;
use stdClass;

/**
 * Automatically adds status-history panel to entities that have a statusField defined in scopes.
 */
class StatusHistory implements AdditionalBuilder
{
	public function build(stdClass $data): void
	{
		$data->clientDefs = $data->clientDefs ?? (object) [];

		// Get all scopes from the $data object itself
		if (!isset($data->scopes)) {
			return;
		}

		foreach (get_object_vars($data->scopes) as $entityType => $scopeData) {
			// Check if this entity has a statusField defined
			$statusField = $scopeData->statusField ?? null;

			if ($statusField === null) {
				continue;
			}

			// Initialize clientDefs for this entity if not exists
			$data->clientDefs->$entityType ??= (object) [];
			$data->clientDefs->$entityType->bottomPanels ??= (object) [];
			$data->clientDefs->$entityType->bottomPanels->detail ??= [];

			// Check if status-history panel is not already defined
			$panelExists = false;

			foreach ($data->clientDefs->$entityType->bottomPanels->detail as $panel) {
				if (isset($panel->name) && $panel->name === 'statusHistory') {
					$panelExists = true;
					break;
				}
			}

			// Add status-history panel to the detail array if not already defined
			if (!$panelExists) {
				$data->clientDefs->$entityType->bottomPanels->detail[] = (object) [
					'name' => 'statusHistory',
					'label' => 'Status History',
					'view' => 'viacrm:views/record/panels/status-history',
					'order' => 4,
					'disabled' => true,
				];
			}
		}
	}
}
