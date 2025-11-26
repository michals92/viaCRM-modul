<?php

namespace Espo\Modules\Viacrm\Core\Mail\Account\Ews\GroupAccount;

use Espo\Core\Exceptions\Error;
use Espo\Core\Utils\Log;
use Espo\Entities\InboundEmail;
use Espo\Modules\Viacrm\Core\Mail\Account\Ews\Fetcher;
use Espo\ORM\EntityManager;
use Throwable;

/**
 * EWS Group Email Account (InboundEmail) fetching service.
 */
class Service
{
	public function __construct(
		private EntityManager $entityManager,
		private AccountFactory $accountFactory,
		private Fetcher $fetcher,
		private Log $log
	) {
	}

	/**
	 * Fetch emails for a group email account.
	 *
	 * @throws Error
	 */
	public function fetch(string $id): void
	{
		/** @var ?InboundEmail $inboundEmail */
		$inboundEmail = $this->entityManager->getEntityById(InboundEmail::ENTITY_TYPE, $id);

		if (!$inboundEmail) {
			throw new Error("InboundEmail {$id} not found.");
		}

		if (!$inboundEmail->get('useEws')) {
			$this->log->warning("InboundEmail {$id} does not use EWS.");

			return;
		}

		$account = $this->accountFactory->create($inboundEmail);

		if (!$account->isAvailableForFetching()) {
			$this->log->info("InboundEmail {$id} is not available for fetching.");

			return;
		}

		try {
			$this->log->info("EWS: Start fetching for InboundEmail {$id}.");

			$this->fetcher->fetch($account);

			$account->updateConnectedAt();

			$this->log->info("EWS: Fetching finished for InboundEmail {$id}.");
		} catch (Throwable $e) {
			$this->log->error("EWS: Error fetching InboundEmail {$id}: " . $e->getMessage());

			throw new Error("EWS fetch failed for InboundEmail {$id}: " . $e->getMessage(), 0, $e);
		}
	}
}
