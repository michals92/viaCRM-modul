<?php

namespace Espo\Modules\Viacrm\Api\Extension;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Modules\Viacrm\Classes\Utils\ExtensionUtil;

class GetInstalledModules implements Action
{
	public function __construct(
		private readonly ExtensionUtil $extensionUtil,
	) {
	}

	public function process(Request $request): Response
	{
		$modules = $this->extensionUtil->getInstalledExtensions();

		return ResponseComposer::json([
			'list' => $modules,
		]);
	}
}
