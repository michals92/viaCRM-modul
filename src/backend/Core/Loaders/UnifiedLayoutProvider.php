<?php

namespace Espo\Modules\Viacrm\Core\Loaders;

use Espo\Core\Container\Loader;
use Espo\Core\InjectableFactory;
use Espo\Modules\Viacrm\Tools\Layout\UnifiedLayoutProvider as Service;

class UnifiedLayoutProvider implements Loader {

	public function __construct(
		private readonly InjectableFactory $injectableFactory,
	) {}

	public function load(): Service {
		return $this->injectableFactory->create(Service::class);
	}

}
