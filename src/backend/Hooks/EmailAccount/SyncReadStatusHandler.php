<?php

namespace Espo\Modules\Autocrm\Hooks\EmailAccount;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Entities\EmailAccount;
use Espo\Modules\Autocrm\Tools\MicrosoftGraph\Subscriber;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements BeforeSave<EmailAccount>
 */
class SyncReadStatusHandler implements BeforeSave {

	public function __construct(
		private readonly Subscriber $subscriber
	) {}

	public function beforeSave(Entity $entity, SaveOptions $options): void {
		if (!$entity->isAttributeChanged('syncReadStatus')) {
			return;
		}

		$assignedUserId = $entity->get('assignedUserId');

		$newValue = $entity->get('syncReadStatus');

		if ($newValue) {
			if ($assignedUserId) {
				$this->onSyncReadStatusEnabled($entity, $assignedUserId);
			}
		} else {
			$this->onSyncReadStatusDisabled($entity);
		}
	}

	private function onSyncReadStatusEnabled(EmailAccount $entity, string $assignedUserId): void {
		$this->subscriber->subscribe($entity, $assignedUserId);
	}

	private function onSyncReadStatusDisabled(EmailAccount $entity): void {
		$this->subscriber->unsubscribeAll($entity);
	}

}
