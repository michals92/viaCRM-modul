<?php

namespace Espo\Modules\Autocrm\Core\Di;

use Espo\Modules\Autocrm\Classes\Utils\ExtensionUtil;

trait ExtensionUtilSetter {

	protected ExtensionUtil $extensionUtil;

	public function setExtensionUtil(ExtensionUtil $extensionUtil): void {
		$this->extensionUtil = $extensionUtil;
	}

}
