<?php

namespace Espo\Modules\Autocrm\Core\Di;

use Espo\Modules\Autocrm\Tools\Client\Helper as ClientHelper;

trait ClientHelperSetter {

	protected ClientHelper $clientHelper;

	public function setClientHelper(ClientHelper $clientHelper): void {
		$this->clientHelper = $clientHelper;
	}

}