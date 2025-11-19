<?php

namespace Espo\Modules\Autocrm\Classes\Authentication;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Authentication\AuthenticationData;
use Espo\Core\Authentication\Result;
use Espo\Core\Di;

class Authentication extends \Espo\Core\Authentication\Authentication implements Di\EntityManagerAware, Di\InjectableFactoryAware {
	use Di\EntityManagerSetter;
	use Di\InjectableFactorySetter;

	private ?UserExposer $userExposer = null;

	public function login(AuthenticationData $data, Request $request, Response $response): Result {
		$result = parent::login(
			$data,
			$request,
			$response
		);

		if (!$result->isSuccess()) {
			return $result;
		}

		$user = $result->getUser();
		$viewAsUserId = $request->getCookieParam('view-as-user-id');

		if (!$viewAsUserId || !$user || !$user->isAdmin()) {
			return $result;
		}

		$user = $this->entityManager->getEntityById('User', $viewAsUserId);

		if (!$user) {
			return $result;
		}

		$applicationUser = $this->getUserExposer()->getUser();
		$applicationUser->reset();
		$applicationUser->set($user->getValueMap());

		return $result;
	}

	private function getUserExposer(): UserExposer {
		return $this->userExposer ??= $this->injectableFactory->create(UserExposer::class);
	}

}
