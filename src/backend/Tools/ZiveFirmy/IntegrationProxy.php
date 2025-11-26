<?php

namespace Espo\Modules\Viacrm\Tools\ZiveFirmy;

use Espo\Core\Exceptions\Error;
use Espo\Entities\Integration;
use Espo\ORM\EntityManager;

class IntegrationProxy {
	public function __construct(
		private EntityManager $entityManager
	) {}

	public function getToken(): string {
		$integration = $this->entityManager->getEntityById(Integration::ENTITY_TYPE, 'ZiveFirmy');

		if (!$integration) {
			throw new Error('ZiveFirmy integration not found');
		}

		$apiToken = $integration->get('token');

		if (!$apiToken) {
			throw new Error('API token not set for ZiveFirmy integration');
		}

		return $apiToken;
	}
}
