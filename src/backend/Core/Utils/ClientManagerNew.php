<?php

namespace Espo\Modules\Viacrm\Core\Utils;

use Espo\Core\Utils\Client\RenderParams;
use Espo\Core\Utils\ClientManager;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use LogicException;

// Detect old or new version (has to be here because of upgrades)
if (ReflectionUtil::classMethodHasParamCount(ClientManager::class, 'render', 1)) {
	/** The actual class
	 */
	class ClientManagerNew extends ClientManagerBase {
		public function display(?string $runScript = null, ?string $htmlFilePath = null, array $vars = []): void {
			$htmlFilePath ??= $this->mainHtmlFilePath;
    
			$vars = $this->clientHelper->prepareVars($this, $vars);
    
			parent::display($runScript, $htmlFilePath, $vars);
		}

		public function render(RenderParams $renderParams): string {
			$htmlFilePath = $this->mainHtmlFilePath;
    
			$vars = $this->clientHelper->prepareVars($this);
    
			return ReflectionUtil::callClassMethod(
				ClientManager::class,
				$this,
				'renderInternal',
				$renderParams->runScript,
				$htmlFilePath, 
				$vars
			);
		}
	}
} else {
	/**
	 * Fake compat class for use when upgrading
	 */
	class ClientManagerNew extends ClientManagerBase {
		/** @disregard */
		public function render(?string $runScript = null, ?string $htmlFilePath = null, array $vars = []): string {
			throw new LogicException();
		}
	}
}