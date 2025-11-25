<?php

namespace Espo\Modules\Viacrm\Core\Di;

use Espo\Core\Container\Container;

trait ContainerSetter {

	protected Container $container;

	public function setContainer(Container $container): void {
		$this->container = $container;
	}

}
