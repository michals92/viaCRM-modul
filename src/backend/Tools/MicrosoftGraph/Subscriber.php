<?php

namespace Espo\Modules\Autocrm\Tools\MicrosoftGraph;

use Espo\Core\Exceptions\Error;
use Espo\Core\ExternalAccount\ClientManager;
use Espo\Core\Field\DateTime;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Log;
use Espo\Entities\ExternalAccount;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Autocrm\Entities\MicrosoftGraphSubscription;
use Espo\Modules\Outlook\Core\Outlook\Clients\Outlook;
use Espo\ORM\Entity;
use Exception;

class Subscriber {

	public function __construct(
		private readonly ClientManager $clientManager,
		private readonly Config $config,
		private readonly EntityManager $entityManager,
		private readonly Log $log
	) {}

	/**
	 * @throws Error
	 */
	public function subscribe(Entity $entity, string $userId): MicrosoftGraphSubscription {
		try {
			/** @var Outlook $outlookClient */
			$outlookClient = $this->clientManager->create('Outlook', $userId);
		} catch (Exception $e) {
			throw new Error('Failed to create Outlook client: ' . $e->getMessage());
		}

		/** @var ExternalAccount $account */
		$account = ReflectionUtil::callMethod($this->clientManager, 'getClientRecord', $outlookClient);

		$data = $account->get('data');

		if (empty($data->accessToken)) {
			throw new Error('No access token found for account: ' . $account->getId());
		}

		// Check for existing subscription
		$existingSubscription = $this->entityManager
		    ->getRDBRepository('MicrosoftGraphSubscription')
		    ->where([
		        'entityId' => $entity->getId(),
		        'entityType' => $entity->getEntityType(),
		    ])
		    ->findOne();

		if ($existingSubscription) {
			return $existingSubscription;
		}

		$subscriptionEndpoint = 'https://graph.microsoft.com/v1.0/subscriptions';

		$expiration = DateTime::createNow()
		    ->modify('+6 days');

		$body = [
		    'changeType' => 'updated',
		    'notificationUrl' => $this->config->get('siteUrl') . '/api/v1/MicrosoftGraph/callback',
		    'resource' => "me/mailFolders('Inbox')/messages",
		    'expirationDateTime' => $expiration->toDateTime()->format('Y-m-d\TH:i:s.u\Z'),
		    'clientState' => Json::encode([
		        'entityType' => $entity->getEntityType(),
		        'entityId' => $entity->getId(),
		        'userId' => $userId,
		    ])
		];

		try {
			$subscriptionResponse = $outlookClient->request(
				$subscriptionEndpoint,
				Json::encode($body),
				'POST',
				httpHeaders: ['Content-Type' => 'application/json']
			);
		} catch (Exception $e) {
			$error = 'Error creating subscription: ' . $e->getMessage();
            
			if (method_exists($outlookClient, 'getLastCurlErrorInfo')) {
				/** @disregard */
				$error .= "\nCurl error details: " . $outlookClient->getLastCurlErrorInfo();
			}

			throw new Error($error);
		}

		if (!isset($subscriptionResponse['id'])) {
			throw new Error('Subscription response does not contain ID');
		}

		$this->log->debug('Subscribed to Microsoft Graph', [
		    'subscriptionId' => $subscriptionResponse['id'],
		    'entityId' => $entity->getId(),
		    'entityType' => $entity->getEntityType(),
		    'expirationDate' => $subscriptionResponse['expirationDateTime']
		]); 

		$dateTime = \DateTime::createFromFormat(
			'Y-m-d\TH:i:s\Z',
			$subscriptionResponse['expirationDateTime']);

		if (!$dateTime) {
			throw new Error('Failed to parse expiration date');
		}

		// Create new subscription entity
		$subscription = $this->entityManager->createEntity('MicrosoftGraphSubscription', [
		    'name' => $entity->get('name') ?? $entity->getId(),
		    'subscriptionId' => $subscriptionResponse['id'],
		    'expirationDate' => DateTime::fromDateTime($dateTime)->toString(),
		    'entityId' => $entity->getId(),
		    'entityType' => $entity->getEntityType(),
		    'assignedUserId' => $userId,
		]);

		return $subscription;
	}

	public function unsubscribeAll(Entity $entity): void {
		// Find all subscriptions for this entity
		$subscriptions = $this->entityManager
		    ->getRDBRepository('MicrosoftGraphSubscription')
		    ->where([
		        'entityId' => $entity->getId(),
		        'entityType' => $entity->getEntityType(),
		    ])
		    ->find();

		foreach ($subscriptions as $subscription) {
			try {
				// Get the user ID from the subscription data
				$userId = $subscription->get('assignedUserId');
                
				if (!$userId) {
					continue;
				}

				/** @var Outlook $outlookClient */
				$outlookClient = $this->clientManager->create('Outlook', $userId);

				// Delete subscription in Microsoft Graph
				$subscriptionEndpoint = 'https://graph.microsoft.com/v1.0/subscriptions/' . 
				    $subscription->get('subscriptionId');

				$this->log->debug('Unsubscribing from Microsoft Graph', [
				    'subscriptionId' => $subscription->get('subscriptionId'),
				    'entityId' => $subscription->get('entityId'),
				    'entityType' => $subscription->get('entityType'),
				]);
                
				$outlookClient->request($subscriptionEndpoint, null, 'DELETE');

				// Delete subscription entity
				$this->entityManager->removeEntity($subscription);
			} catch (Exception $e) {
				throw new Error('Failed to unsubscribe: ' . $e->getMessage());
			}
		}
	}

}
