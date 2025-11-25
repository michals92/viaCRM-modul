<?php

namespace Espo\Modules\Viacrm\Core\Utils\Metadata\AdditionalBuilder;

use stdClass;

class CalendarEntityManagerParams extends AdditionalBuilderWithConfig {

	public function build(stdClass $data): void {
		if (!isset($data->app) || !isset($data->app->entityManagerParams)) {
			return;
		}

		$calendarEntityList = $this->config->get('calendarEntityList', []);

		foreach ($calendarEntityList as $scope) {
			$data->app->entityManagerParams->$scope ??= new stdClass();

			$data->app->entityManagerParams->$scope->calendarDateStart = (object)[
				'fieldDefs' => (object)[
					'type' => 'enum',
					'view' => 'autocrm:views/admin/entity-manager/fields/date-field',
				],
				'location' => 'clientDefs'
			];
			$data->app->entityManagerParams->$scope->calendarDateEnd = (object)[
				'fieldDefs' => (object)[
					'type' => 'enum',
					'view' => 'autocrm:views/admin/entity-manager/fields/date-field',
				],
				'location' => 'clientDefs'
			];
		}
	}

}
