<?php

namespace Espo\Modules\Viacrm\Core\Utils;

use Espo\Core\Di;
use Espo\Core\Utils\ClientManager;
use Espo\Modules\Viacrm\Core\Di as ViacrmDi;

class ClientManagerBase extends ClientManager implements Di\ConfigAware, ViacrmDi\ClientHelperAware
{
	use ViacrmDi\ClientHelperSetter;
	use Di\ConfigSetter;

	protected string $mainHtmlFilePath = 'application/Espo/Modules/Viacrm/Resources/html/main.tpl';
}
