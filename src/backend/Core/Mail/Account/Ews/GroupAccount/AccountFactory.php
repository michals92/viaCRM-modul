<?php

namespace Espo\Modules\Viacrm\Core\Mail\Account\Ews\GroupAccount;

use Espo\Core\Utils\Crypt;
use Espo\Entities\InboundEmail;
use Espo\ORM\EntityManager;

/**
 * Factory for creating EWS GroupAccount Account wrappers.
 */
class AccountFactory {

	public function __construct(
		private EntityManager $entityManager,
		private Crypt $crypt
	) {}

	public function create(InboundEmail $entity): Account {
		return new Account($entity, $this->entityManager, $this->crypt);
	}

}
