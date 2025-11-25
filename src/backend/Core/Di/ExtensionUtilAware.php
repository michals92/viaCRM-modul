<?php

namespace Espo\Modules\Viacrm\Core\Di;

use Espo\Modules\Viacrm\Classes\Utils\ExtensionUtil;

interface ExtensionUtilAware {

	public function setExtensionUtil(ExtensionUtil $extensionUtil): void;

}
