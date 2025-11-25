<?php

namespace Espo\Modules\Viacrm\Core\Di;

use Espo\Modules\Viacrm\Tools\Client\Helper as ClientHelper;

trait ClientHelperSetter {

	protected ClientHelper $clientHelper;

	public function setClientHelper(ClientHelper $clientHelper): void {
		$this->clientHelper = $clientHelper;
	}

}