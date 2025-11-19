<?php

namespace Espo\Modules\Autocrm\Api\Alert;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\ORM\EntityManager;
use Espo\Entities\User;
use Espo\Modules\Autocrm\Entities\Alert;

class ToggleAlert implements Action {

	public function __construct(
		private readonly User          $user,
		private readonly EntityManager $entityManager
	) {}

	/**
	 * @param  Request    $request
	 * @throws BadRequest
	 * @return Response
	 *
	 */
	public function process(Request $request): Response {
		$data = $request->getParsedBody();

		if (empty($data->id)) {
			throw new BadRequest('Missing alert id.');
		}

		$alertId = $data->id;
		/** @var Alert $alert */
		$alert = $this->entityManager->getEntityById(Alert::ENTITY_TYPE, $alertId) ?? throw new BadRequest("Alert $alertId does not exist.");

		$isActive = $alert->toggleUser($this->user->getId());

		return ResponseComposer::json(['isActive' => $isActive]);
	}

}
