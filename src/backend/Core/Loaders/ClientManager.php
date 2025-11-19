<?php

namespace Espo\Modules\Autocrm\Core\Loaders;

use Espo\Core\Container\Loader;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Config;
use Espo\Modules\Autocrm\Core\Utils\ClientManagerNew;
use Espo\Modules\Autocrm\Core\Utils\ClientManagerOld;

class ClientManager implements Loader {

	public function __construct(
		private readonly Config $config,
		private readonly InjectableFactory $injectableFactory,
	) {}

	public function load() {
		$version = $this->config->get('version');

		// The signature of the 'render' method is changed from 9.0.0 onwards
		if (version_compare($version, '9.0.0', '>=')) {
			return $this->injectableFactory->create(ClientManagerNew::class);
		} else {
			return $this->injectableFactory->create(ClientManagerOld::class);
		}
	}

}
