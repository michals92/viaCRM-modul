<?php

namespace Espo\Core\ORM\Repositories;

use Espo\Core\Traits\Injectable;
use Espo\Modules\Viacrm\Core\Di;
use Espo\ORM\Entity;

/**
 * This keeps compatibility with older versions of modules
 * 
 * @template TEntity of Entity
 * @extends \Espo\Core\Repositories\Database<TEntity>
 */
class RDB extends \Espo\Core\Repositories\Database implements Di\ContainerAware {
	// @phpstan-ignore traitUse.deprecated
	use Injectable;	
	use Di\ContainerSetter;

	public function getInjection(string $name): mixed {
		return $this->container->get($name);
	}

}