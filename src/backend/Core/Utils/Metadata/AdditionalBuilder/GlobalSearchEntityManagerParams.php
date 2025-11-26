<?php

namespace Espo\Modules\Viacrm\Core\Utils\Metadata\AdditionalBuilder;

use stdClass;

class GlobalSearchEntityManagerParams extends AdditionalBuilderWithConfig
{
	public function build(stdClass $data): void
	{
		if (!isset($data->app) || !isset($data->app->entityManagerParams)) {
			return;
		}

		$calendarEntityList = $this->config->get('globalSearchEntityList', []);

		foreach ($calendarEntityList as $scope) {
			$data->app->entityManagerParams->$scope ??= new stdClass();

			$data->app->entityManagerParams->$scope->globalSearchDisplayFields = (object) [
				'fieldDefs' => (object) [
					'type' => 'multiEnum',
					'view' => 'viacrm:views/admin/entity-manager/fields/global-search-display-fields',
				],
				'location' => 'clientDefs',
			];
		}
	}
}
