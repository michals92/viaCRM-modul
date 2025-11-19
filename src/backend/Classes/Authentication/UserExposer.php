<?php

namespace Espo\Modules\Autocrm\Classes\Authentication;

use Espo\Core\Container;
use Espo\Entities\User;

class UserExposer {

	public function __construct(
		public readonly Container $container,
	) {}

	public function getUser(): User {
		$user = $this->container->get('user');

		assert($user instanceof User);

		return $user;
	}

}
