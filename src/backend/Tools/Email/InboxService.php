<?php

namespace Espo\Modules\Autocrm\Tools\Email;

use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Json;
use Espo\Entities\Email;
use Espo\Entities\EmailAccount;
use Espo\Entities\InboundEmail;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Autocrm\Core\Di;
use Espo\Modules\Outlook\Core\Outlook\Clients\Outlook;

/**
 * This is overriden so that we can sync read status to Microsoft Graph
 */
class InboxService extends \Espo\Tools\Email\InboxService implements Di\ExternalAccountClientManagerAware {
	use Di\ExternalAccountClientManagerSetter;

	public function markAsRead(string $id, ?string $userId = null): void {
		parent::markAsRead($id, $userId);
		$this->syncToGraph($id, true, $userId);
	}

	public function markAsNotRead(string $id, ?string $userId = null): void {
		parent::markAsNotRead($id, $userId);
		$this->syncToGraph($id, false, $userId);
	}

	private function syncToGraph(string $emailId, bool $isRead, ?string $userId = null): void {
		/** @var EntityManager $entityManager */
		$entityManager = ReflectionUtil::getClassProperty(parent::class, $this, 'entityManager');
        
		if (!$userId) {
			/** @var \Espo\Entities\User $user */
			$user = ReflectionUtil::getClassProperty(parent::class, $this, 'user');
			$userId = $user->getId();
		}

		/** @var Email|null $email */
		$email = $entityManager->getEntityById('Email', $emailId);

		if (!$email || !$email->get('messageId')) {
			return;
		}

		// Get all email accounts linked to this user
		$emailAccount = $entityManager
		    ->getRDBRepository(EmailAccount::ENTITY_TYPE)
		    ->where([
		        'assignedUserId' => $userId,
		        'syncReadStatus' => true,
		    ])
		    ->findOne();

		// Get all group email accounts (inbound emails) linked to this user
		$inboundEmail = $entityManager
		    ->getRDBRepository(InboundEmail::ENTITY_TYPE)
		    ->where([
		        'assignedUserId' => $userId,
		        'syncReadStatus' => true,
		    ])
		    ->findOne();

		if ($emailAccount || $inboundEmail) {
			try {
				/** @var Outlook $outlookClient */
				$outlookClient = $this->clientManager->create('Outlook', $userId);

				$messageId = $email->get('messageId');

				$messageIdPart = urlencode($messageId);

				// Search for the email in Outlook by Message-ID
				$searchEndpoint = "https://graph.microsoft.com/v1.0/me/messages?\$filter=internetMessageId%20eq%20'$messageIdPart'";
                
				$response = $outlookClient->request($searchEndpoint);
                
				if (empty($response['value'])) {
					$GLOBALS['log']->debug(
						'Email not found in Microsoft Graph',
						[
						    'emailId' => $emailId,
						    'userId' => $userId,
						    'messageId' => $messageId
						]
					);

					return;
				}

				$graphMessageId = $response['value'][0]['id'];
				$updateEndpoint = "https://graph.microsoft.com/v1.0/me/messages/$graphMessageId";
                
				$outlookClient->request(
					$updateEndpoint,
					Json::encode(['isRead' => $isRead]),
					'PATCH',
					httpHeaders: ['Content-Type' => 'application/json']
				);

				$GLOBALS['log']->debug(
					'Synced email read status to Microsoft Graph', 
					[
					    'emailId' => $emailId,
					    'userId' => $userId,
					    'isRead' => $isRead
					]
				);
			} catch (\Exception $e) {
				$GLOBALS['log']->error(
					'Failed to sync read status to Microsoft Graph: ' . $e->getMessage(),
					[
					    'emailId' => $emailId,
					    'userId' => $userId,
					]
				);
			}
		}
	}

}
