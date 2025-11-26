<?php

namespace Espo\Modules\Viacrm\Core\Utils\Metadata\AdditionalBuilder;

use Espo\Core\Utils\Metadata\AdditionalBuilder;
use stdClass;

class ExtenderScript implements AdditionalBuilder {
	public function build(stdClass $data): void {
		// Initialize app.client if not present
		$data->app ??= (object)[];
		$data->app->client ??= (object)[];

		// Prepend extender.js to scriptList (production mode)
		$data->app->client->scriptList ??= [];
		$data->app->client->scriptList = ['client/modules/viacrm/src/js/extender.js', ...$data->app->client->scriptList];

		// Prepend extender.js to developerModeScriptList (developer mode)
		$data->app->client->developerModeScriptList ??= [];
		$data->app->client->developerModeScriptList = ['client/modules/viacrm/src/js/extender.js', ...$data->app->client->developerModeScriptList];
	}
}
