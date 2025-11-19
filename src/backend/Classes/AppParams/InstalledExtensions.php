<?php

namespace Espo\Modules\Autocrm\Classes\AppParams;

use Espo\Modules\Autocrm\Tools\Extension\Service as ExtensionService;
use Espo\Tools\App\AppParam;

class InstalledExtensions implements AppParam {

	public function __construct(
		private readonly ExtensionService $extensionService
	) {}

	public function get(): mixed {
		return $this->extensionService->getInstalledExtensions();
	}

}
