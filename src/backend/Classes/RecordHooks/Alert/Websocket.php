<?php

namespace Espo\Modules\Autocrm\Classes\RecordHooks\Alert;

use Espo\Core\Record\Hook\UpdateHook;
use Espo\Core\Record\UpdateParams;
use Espo\Modules\Autocrm\Entities\Alert;
use Espo\Modules\Autocrm\Entities\User;
use Espo\Modules\Autocrm\Tools\Alert\NotificationProvider;
use Espo\ORM\Entity;

/**
 * @implements UpdateHook<Alert>
 */
readonly class Websocket implements UpdateHook {

	public function __construct(
		private NotificationProvider $notificationProvider,
		private User                 $user,
	) {}

	/**
	 * @param Alert $entity
	 */
	public function process(Entity $entity, UpdateParams $params): void {
		if ($this->user->isSystem()) {
			return;
		}

		$this->notificationProvider->get($this->user);
	}

}