<?php

namespace Espo\Modules\Autocrm\Core\Di;

use Espo\Modules\Autocrm\Classes\Utils\ExtensionUtil;

interface ExtensionUtilAware {

	public function setExtensionUtil(ExtensionUtil $extensionUtil): void;

}
