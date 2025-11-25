<?php

namespace Espo\Modules\Viacrm\Core\Di;

use Espo\Core\Container\Container;

interface ContainerAware {

	public function setContainer(Container $container): void;

}
