<?php

namespace Espo\Modules\Autocrm\Api\Mail\Account\PersonalAccount;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\Error;
use Espo\Core\Field\DateTime;
use Espo\Core\Mail\Account\Fetcher;
use Espo\Core\Mail\Account\PersonalAccount\AccountFactory;
use Espo\Core\Mail\Account\PersonalAccount\FetcherFactory;
use Espo\Core\Mail\Exceptions\ImapError;
use Espo\Core\Mail\Exceptions\NoImap;
use Espo\Entities\EmailAccount;
use Espo\Entities\User;
use Espo\ORM\EntityManager;
use Exception;

class SyncImap implements Action {

	public function __construct(
		private readonly EntityManager  $entityManager,
		private readonly AccountFactory $accountFactory,
		private readonly FetcherFactory $fetcherFactory,
		private readonly User           $user
	) {}

	public function process(Request $request): Response {
		if ($this->user->isAdmin() !== true) {
			throw new \LogicException('Admin only');
		}
		
		$body = $request->getParsedBody();
		$ids = $body->ids;
		$hours = (int)$body->hours;
		$fetcher = $this->fetcherFactory->create();
		$allGood = true;

		foreach ($ids as $id) {
			try {
				$this->syncAccount($fetcher, (string)$id, $hours);
			} catch (Exception $ex) {
				$allGood = false;
				$GLOBALS['log']->error($ex->getMessage());
			}
		}

		return ResponseComposer::json(['success' => $allGood]);
	}

	/**
	 * @throws ImapError
	 * @throws NoImap
	 * @throws Error
	 * @throws Exception
	 */
	protected function syncAccount(Fetcher $fetcher, string $id, int $hours): void {
		/** @var EmailAccount|null $emailAccount */
		$emailAccount = $this->entityManager->getEntityById(EmailAccount::ENTITY_TYPE, $id);

		if (!$emailAccount) {
			throw new \RuntimeException("Imap syncer(syncAccount) - Email account not found $id");
		}

		$emailAccount->set('connectedAt', DateTime::createNow()->addHours(-$hours)->toString());
		$account = $this->accountFactory->create($id);
		$fetcher->fetch($account);
		$account->updateConnectedAt();
	}

}