<?php

namespace Espo\Modules\Autocrm\Core\Di;

use Espo\Core\ExternalAccount\ClientManager;

trait ExternalAccountClientManagerSetter {

	protected ClientManager $clientManager;

	public function setExternalAccountClientManager(ClientManager $clientManager): void {
		$this->clientManager = $clientManager;
	}

}