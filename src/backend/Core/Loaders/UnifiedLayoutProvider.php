<?php

namespace Espo\Modules\Autocrm\Core\Loaders;

use Espo\Core\Container\Loader;
use Espo\Core\InjectableFactory;
use Espo\Modules\Autocrm\Tools\Layout\UnifiedLayoutProvider as Service;

class UnifiedLayoutProvider implements Loader {

	public function __construct(
		private readonly InjectableFactory $injectableFactory,
	) {}

	public function load(): Service {
		return $this->injectableFactory->create(Service::class);
	}

}
