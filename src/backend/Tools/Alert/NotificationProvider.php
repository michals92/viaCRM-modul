<?php

namespace Espo\Modules\Autocrm\Tools\Alert;

use Espo\Entities\User;
use Espo\Modules\Autocrm\Entities\Alert;

class NotificationProvider implements \Espo\Tools\PopupNotification\Provider {

	public function __construct(
		private readonly AlertManager $alertManager,
	) {}

	public function get(User $user): array {
		$userId = $user->getId();
		$alerts = $this->alertManager->getActive($userId);
		$resultList = [];

		/** @var Alert $alert */
		foreach ($alerts as $alert) {
			$item = $this->alertManager->submitWebSocketNotification($userId, $alert);
			if ($item) {
				$resultList[] = $item;
			}
		}

		return $resultList;
	}

}
