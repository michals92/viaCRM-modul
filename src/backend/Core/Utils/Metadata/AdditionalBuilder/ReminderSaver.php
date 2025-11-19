<?php

namespace Espo\Modules\Autocrm\Core\Utils\Metadata\AdditionalBuilder;

use Espo\Core\Utils\Metadata\AdditionalBuilder;
use stdClass;

class ReminderSaver implements AdditionalBuilder {

	public function build(stdClass $data): void {
		$entitiesToModify = ['Task', 'Meeting', 'Call'];
		$originalClass = 'Espo\\Core\\FieldProcessing\\Reminder\\Saver';
		$replaceWithClass = 'Espo\\Modules\\Autocrm\\Core\\FieldProcessing\\Reminder\\Saver';

		foreach ($entitiesToModify as $entityType) {
			if (!isset($data->recordDefs->$entityType->saverClassNameList)) {
				continue;
			}

			$saverList = $data->recordDefs->$entityType->saverClassNameList;
			$key = array_search($originalClass, $saverList);

			if ($key !== false) {
				$saverList[$key] = $replaceWithClass;
				$data->recordDefs->$entityType->saverClassNameList = $saverList;
			}
		}
	}

}
