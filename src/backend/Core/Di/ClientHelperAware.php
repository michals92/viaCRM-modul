<?php

namespace Espo\Modules\Autocrm\Core\Di;

use Espo\Modules\Autocrm\Tools\Client\Helper as ClientHelper;

interface ClientHelperAware {

	public function setClientHelper(ClientHelper $clientHelper): void;

}