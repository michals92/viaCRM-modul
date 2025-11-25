<?php

namespace Espo\Modules\Viacrm\Classes\RecordHooks\Alert;

use Espo\Core\Record\Hook\UpdateHook;
use Espo\Core\Record\UpdateParams;
use Espo\Modules\Viacrm\Entities\Alert;
use Espo\Modules\Viacrm\Entities\User;
use Espo\Modules\Viacrm\Tools\Alert\NotificationProvider;
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