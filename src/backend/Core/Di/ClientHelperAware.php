<?php

namespace Espo\Modules\Viacrm\Core\Di;

use Espo\Modules\Viacrm\Tools\Client\Helper as ClientHelper;

interface ClientHelperAware {
	public function setClientHelper(ClientHelper $clientHelper): void;
}