<?php

namespace Espo\Modules\Viacrm\Core\Di;

use Espo\Modules\Viacrm\Classes\Utils\ExtensionUtil;

trait ExtensionUtilSetter {
	protected ExtensionUtil $extensionUtil;

	public function setExtensionUtil(ExtensionUtil $extensionUtil): void {
		$this->extensionUtil = $extensionUtil;
	}
}
