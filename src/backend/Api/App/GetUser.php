<?php

namespace Espo\Modules\Viacrm\Api\App;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\InjectableFactory;
use Espo\Entities\User;
use Espo\Tools\App\AppService as Service;

/**
 * Gets user data.
 */
class GetUser implements Action {
	public function __construct(
		private readonly InjectableFactory $injectableFactory,
		private readonly User $user,
	) {}

	public function process(Request $request): Response {
		if (!$this->user->has('rolesIds')) {
			$this->user->loadLinkMultipleField('roles');
		}

		$data = $this->injectableFactory
		    ->create(Service::class)
		    ->getUserData();

		if ($data['user']) {
			$data['user']->rolesIds = $this->user->get('rolesIds');
			$data['user']->rolesNames = $this->user->get('rolesNames');
		}

		return ResponseComposer::json($data);
	}
}
