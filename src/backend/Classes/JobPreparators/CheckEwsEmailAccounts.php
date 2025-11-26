<?php

namespace Espo\Modules\Viacrm\Classes\JobPreparators;

use DateTimeImmutable;
use Espo\Core\Job\Preparator;
use Espo\Core\Job\Preparator\CollectionHelper;
use Espo\Core\Job\Preparator\Data;
use Espo\Entities\EmailAccount;
use Espo\ORM\EntityManager;

/**
 * Prepares jobs for checking EWS personal email accounts.
 */
class CheckEwsEmailAccounts implements Preparator
{
	/**
	 * @param CollectionHelper<EmailAccount> $helper
	 */
	public function __construct(
		private EntityManager $entityManager,
		private CollectionHelper $helper
	) {
	}

	public function prepare(Data $data, DateTimeImmutable $executeTime): void
	{
		$collection = $this->entityManager
			->getRDBRepositoryByClass(EmailAccount::class)
			->join('assignedUser', 'assignedUserAdditional')
			->where([
				'status' => EmailAccount::STATUS_ACTIVE,
				'useEws' => true,
				'assignedUserAdditional.isActive' => true,
			])
			->find();

		$this->helper->prepare($collection, $data, $executeTime);
	}
}
