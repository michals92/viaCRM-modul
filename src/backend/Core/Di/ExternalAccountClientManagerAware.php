<?php

namespace Espo\Modules\Viacrm\Core\Di;

use Espo\Core\ExternalAccount\ClientManager;

interface ExternalAccountClientManagerAware
{
	public function setExternalAccountClientManager(ClientManager $clientManager): void;
}
