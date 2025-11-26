<?php

namespace Espo\Modules\Viacrm\Classes\Authentication;

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
