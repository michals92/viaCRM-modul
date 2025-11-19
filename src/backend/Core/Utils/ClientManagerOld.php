<?php

namespace Espo\Modules\Autocrm\Core\Utils;

use Espo\Core\Utils\Client\RenderParams;
use Espo\Core\Utils\ClientManager;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use LogicException;

if (ReflectionUtil::classMethodHasParamCount(ClientManager::class, 'render', 1)) {
	/**
	 * Fake compat class for use when upgrading
	 */
	class ClientManagerOld extends ClientManagerBase {

		public function render(RenderParams $renderParams): string {
			throw new LogicException();
		}

	}
} else {
	/** The actual class
	 * This should only be used (and statically analyzed by phpstan for espo versions < 9.0.0)
	 */
	class ClientManagerOld extends ClientManagerBase {

		/** @disregard */
		public function render(?string $runScript = null, ?string $htmlFilePath = null, array $vars = []): string {
			$htmlFilePath ??= 'application/Espo/Modules/Autocrm/Resources/html/main.tpl';
    
			$vars = $this->clientHelper->prepareVars($this, $vars);
    
			/** @disregard */
			return parent::render($runScript, $htmlFilePath, $vars);
		}

	}
}