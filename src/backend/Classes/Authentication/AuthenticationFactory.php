<?php

namespace Espo\Modules\Viacrm\Classes\Authentication;

use Espo\Core\Di;

class AuthenticationFactory extends \Espo\Core\Authentication\AuthenticationFactory implements Di\InjectableFactoryAware {
	use Di\InjectableFactorySetter;

	public function create(): Authentication {
		return $this->injectableFactory->create(Authentication::class);
	}

}
