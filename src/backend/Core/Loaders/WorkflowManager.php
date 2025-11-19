<?php

namespace Espo\Modules\Autocrm\Core\Loaders;

use Espo\Core\Container;
use Espo\Core\Container\Loader;
use Espo\Core\InjectableFactory;
use Espo\Modules\Autocrm\Core\WorkflowManager as Service;

class WorkflowManager implements Loader {

	public function __construct(
		private readonly Container $container,
		private InjectableFactory $injectableFactory
	) {}

	public function load(): Service {
		return new Service($this->container, $this->injectableFactory);
	}

}
