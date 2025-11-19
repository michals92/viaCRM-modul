<?php

namespace Espo\Modules\Autocrm\Core\Loaders;

use Espo\Core\Container\Loader;
use Espo\Core\InjectableFactory;
use Espo\Modules\Autocrm\Core\AclManager as AclManagerService;

class AclManager implements Loader {

	public function __construct(
		private readonly InjectableFactory $injectableFactory,
	) {}

	public function load() {
		return $this->injectableFactory->create(AclManagerService::class);
	}

}
