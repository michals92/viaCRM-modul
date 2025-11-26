<?php

namespace Espo\Modules\Viacrm\Core\Mail\Account\Ews\PersonalAccount;

use Espo\Core\Utils\Crypt;
use Espo\Entities\EmailAccount;
use Espo\ORM\EntityManager;

/**
 * Factory for creating EWS PersonalAccount Account wrappers.
 */
class AccountFactory
{
	public function __construct(
		private EntityManager $entityManager,
		private Crypt $crypt
	) {
	}

	public function create(EmailAccount $entity): Account
	{
		return new Account($entity, $this->entityManager, $this->crypt);
	}
}
