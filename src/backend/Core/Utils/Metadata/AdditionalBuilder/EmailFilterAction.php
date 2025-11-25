<?php

namespace Espo\Modules\Viacrm\Core\Utils\Metadata\AdditionalBuilder;

use Espo\Core\Utils\Metadata\AdditionalBuilder;
use stdClass;

class EmailFilterAction implements AdditionalBuilder {

	public function build(stdClass $data): void {
		if (
			(isset($data->entityDefs->EmailFilter)) &&
			($actions = $data->app->email->actionClassNameMap)
		) {
			$data->entityDefs->EmailFilter->fields->action ??= (object)[];
			$data->entityDefs->EmailFilter->fields->action->options ??= (object)[];

			$options = (array)$data->entityDefs->EmailFilter->fields->action->options;

			$data->entityDefs->EmailFilter->fields->action->options =
				array_unique([
					...$options,
					...array_keys((array)$actions)
				]);
		}
	}

}
