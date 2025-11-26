<?php

namespace Espo\Modules\Viacrm\Core\Loaders;

use Espo\Core\Container\Loader;
use Espo\Core\InjectableFactory;
use Espo\Modules\Viacrm\Core\AclManager as AclManagerService;

class AclManager implements Loader
{
	public function __construct(
		private readonly InjectableFactory $injectableFactory,
	) {
	}

	public function load()
	{
		return $this->injectableFactory->create(AclManagerService::class);
	}
}
