<?php

namespace Espo\Core\Hooks;

use Espo\Core\Traits\Injectable;
use Espo\Modules\Viacrm\Core\Di;
/**
 * This keeps compatibility with older versions of modules
 */
abstract class Base implements Di\ContainerAware {
	// @phpstan-ignore traitUse.deprecated
	use Injectable;	
	use Di\ContainerSetter;

	public function getInjection(string $name): mixed {
		return $this->container->get($name);
	}
}