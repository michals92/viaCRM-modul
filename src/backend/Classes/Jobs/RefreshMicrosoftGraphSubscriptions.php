<?php

namespace Espo\Modules\Viacrm\Classes\Jobs;

use Espo\Core\ExternalAccount\ClientManager;
use Espo\Core\Field\DateTime;
use Espo\Core\Job\JobDataLess;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Log;
use Espo\Modules\Outlook\Core\Outlook\Clients\Outlook;

class RefreshMicrosoftGraphSubscriptions implements JobDataLess {

	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly ClientManager $clientManager,
		private readonly Log $log,
	) {}

	public function run(): void {
		$subscriptions = $this->entityManager
		    ->getRDBRepository('MicrosoftGraphSubscription')
		    ->find();

		foreach ($subscriptions as $subscription) {
			try {
				$userId = $subscription->get('assignedUserId');
				if (!$userId) {
					continue;
				}

				/** @var Outlook $outlookClient */
				$outlookClient = $this->clientManager->create('Outlook', $userId);

				// Format expiration date for Graph API
				$expirationDate = DateTime::createNow()
				    ->modify('+6 days')
				    ->toDateTime()
				    ->format('Y-m-d\TH:i:s.u\Z');

				$subscriptionEndpoint = 'https://graph.microsoft.com/v1.0/subscriptions/' . 
				    $subscription->get('subscriptionId');

				$body = [
				    'expirationDateTime' => $expirationDate
				];

				$outlookClient->request(
					$subscriptionEndpoint,
					Json::encode($body),
					'PATCH',
					httpHeaders: ['Content-Type' => 'application/json']
				);

				// Update subscription entity with new expiration date
				$subscription->set('expirationDate',
					DateTime::createNow()
					    ->modify('+6 days')
					    ->toString()
				);
				$this->entityManager->saveEntity($subscription);
			} catch (\Exception $e) {
				$this->log->error('Failed to refresh Microsoft Graph subscription: ' . $e->getMessage(), [
				    'subscription' => $subscription->getId(),
				    'exception' => $e
				]);
			}
		}
	}

}
