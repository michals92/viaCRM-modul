<?php

namespace Espo\Modules\Viacrm\Api\MicrosoftGraph;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\ExternalAccount\ClientManager;
use Espo\Core\InjectableFactory;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Log;
use Espo\Entities\Email;
use Espo\Modules\Outlook\Core\Outlook\Clients\Outlook;
use Espo\Tools\Email\InboxService;
use stdClass;

class Callback implements Action {

	public function __construct(
		private readonly Log $log,
		private readonly EntityManager $entityManager,
		private readonly ClientManager $clientManager,
		private readonly InjectableFactory $injectableFactory
	) {}

	public function process(Request $request): Response {
		$validationToken = $request->getQueryParam('validationToken');

		/** Create through injectable factory so that we do not get the overridden class that syncs the status back to viacrm */
		$inboxService = $this->injectableFactory->create(InboxService::class);

		$body = $request->getParsedBody();

		$this->log->info('Microsoft Graph callback received', [
		    'body' => $body
		]);
        
		if ($validationToken) {
			return ResponseComposer::empty()
			    ->setHeader('Content-Type', 'text/plain')
			    ->writeBody($validationToken);
		}

		if (empty($body->value)) {
			return ResponseComposer::json(null);
		}

		foreach ($body->value as $notification) {
			try {
				/** @var stdClass $clientState */
				$clientState = Json::decode($notification->clientState);
                
				if (empty($clientState->entityType) || empty($clientState->entityId) || empty($clientState->userId)) {
					$this->log->warning('Invalid clientState format in Microsoft Graph notification', [
					    'clientState' => $notification->clientState
					]);
					continue;
				}

				// Should be either an EmailAccount or an InboundEmail
				$entity = $this->entityManager
				    ->getEntityById($clientState->entityType, $clientState->entityId);

				if (!$entity) {
					throw new NotFound("Entity {$clientState->entityType} with id {$clientState->entityId} not found");
				}

				$graphMessageId = $notification->resourceData->id ?? null;

				if (!$graphMessageId) {
					continue;
				}

				/** @var Outlook $outlookClient */
				$outlookClient = $this->clientManager->create('Outlook', $clientState->userId);

				// Fetch the full message from Graph API
				$messageEndpoint = "https://graph.microsoft.com/v1.0/me/messages/$graphMessageId";
				$messageData = $outlookClient->request($messageEndpoint);

				if (empty($messageData['internetMessageId'])) {
					$this->log->warning('No internetMessageId found in Graph message', [
					    'graphMessageId' => $graphMessageId
					]);
					continue;
				}

				// Find our email by Message-ID
				/** @var Email|null $email */
				$email = $this->entityManager
				    ->getRDBRepository(Email::ENTITY_TYPE)
				    ->where(['messageId' => $messageData['internetMessageId']])
				    ->findOne();

				if (!$email) {
					$this->log->debug('Email not found for Microsoft Graph notification', [
					    'messageId' => $messageData['internetMessageId']
					]);
					continue;
				}

				// Update email properties based on the notification
				if (isset($messageData['isRead'])) {
					$this->log->debug('Updating email read status based on Microsoft Graph notification', [
					    'emailId' => $email->getId(),
					    'isRead' => $messageData['isRead'],
					    'userId' => $clientState->userId
					]);

					if ($messageData['isRead']) {
						$inboxService->markAsRead($email->getId(), $clientState->userId);
					} else {
						$inboxService->markAsNotRead($email->getId(), $clientState->userId);
					}
				}
			} catch (\Exception $e) {
				$this->log->error('Error processing Microsoft Graph notification: ' . $e->getMessage(), [
				    'notification' => $notification,
				    'exception' => $e
				]);
			}
		}

		return ResponseComposer::json(null);
	}

}
