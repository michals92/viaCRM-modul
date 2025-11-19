<?php

namespace Espo\Modules\Autocrm\Core\Utils;

use Espo\Core\Di;
use Espo\Core\Utils\ClientManager;
use Espo\Modules\Autocrm\Core\Di as AutocrmDi;

class ClientManagerBase extends ClientManager implements Di\ConfigAware, AutocrmDi\ClientHelperAware {
	use AutocrmDi\ClientHelperSetter;
	use Di\ConfigSetter;

	protected string $mainHtmlFilePath = 'application/Espo/Modules/Autocrm/Resources/html/main.tpl';

}
