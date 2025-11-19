<?php

namespace Espo\Modules\Autocrm\Core\Mail\Account\Ews\PersonalAccount;

use Espo\Core\Exceptions\Error;
use Espo\Core\Utils\Log;
use Espo\Entities\EmailAccount;
use Espo\Modules\Autocrm\Core\Mail\Account\Ews\Fetcher;
use Espo\ORM\EntityManager;
use Throwable;

/**
 * EWS Personal Email Account fetching service.
 */
class Service {

	public function __construct(
		private EntityManager $entityManager,
		private AccountFactory $accountFactory,
		private Fetcher $fetcher,
		private Log $log
	) {}

	/**
	 * Fetch emails for a personal email account.
	 *
	 * @throws Error
	 */
	public function fetch(string $id): void {
		/** @var ?EmailAccount $emailAccount */
		$emailAccount = $this->entityManager->getEntityById(EmailAccount::ENTITY_TYPE, $id);

		if (!$emailAccount) {
			throw new Error("EmailAccount {$id} not found.");
		}

		if (!$emailAccount->get('useEws')) {
			$this->log->warning("EmailAccount {$id} does not use EWS.");

			return;
		}

		$account = $this->accountFactory->create($emailAccount);

		if (!$account->isAvailableForFetching()) {
			$this->log->info("EmailAccount {$id} is not available for fetching.");

			return;
		}

		try {
			$this->log->info("EWS: Start fetching for EmailAccount {$id}.");

			$this->fetcher->fetch($account);

			$account->updateConnectedAt();

			$this->log->info("EWS: Fetching finished for EmailAccount {$id}.");
		} catch (Throwable $e) {
			$this->log->error("EWS: Error fetching EmailAccount {$id}: " . $e->getMessage());

			throw new Error("EWS fetch failed for EmailAccount {$id}: " . $e->getMessage(), 0, $e);
		}
	}

}
