<?php

namespace Espo\Modules\Viacrm\Core\Utils\Metadata\AdditionalBuilder;

use stdClass;

class ExtraLayouts extends AdditionalBuilderWithConfig {

	public function build(stdClass $data): void {
		if (!isset($data->clientDefs)) {
			return;
		}

		$calendarEntityList = $this->config->get('calendarEntityList', []);

		$calendarLayoutsEnabled = $this->config->get('useLayoutsInCalendar', false);

		foreach (get_object_vars($data->clientDefs) as $entityType => $clientDefsItem) {
			$gridViewMode = $clientDefsItem->gridViewMode ?? false;
			$userKanbanViewMode = $clientDefsItem->userKanbanViewMode ?? false;
			$isCalendar = in_array($entityType, $calendarEntityList);

			if (!$gridViewMode && !$isCalendar) {
				continue;
			}

			$data->clientDefs->{$entityType}->additionalLayouts ??= new stdClass();

			if ($gridViewMode) {
				$data->clientDefs->{$entityType}->additionalLayouts->grid = (object)[
					'type' => 'list',
				];
			}

			if ($userKanbanViewMode) {
				$data->clientDefs->{$entityType}->additionalLayouts->userKanban = (object)[
					'type' => 'list',
				];
			}

			if ($calendarLayoutsEnabled && $isCalendar) {
				$data->clientDefs->{$entityType}->additionalLayouts->calendar = (object)[
					'type' => 'list',
				];
			}
		}
	}

}
