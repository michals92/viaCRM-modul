<?php

namespace Espo\Modules\Viacrm\Tools\Alert;

use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Log;
use Espo\Core\WebSocket\Submission;
use Espo\Modules\Viacrm\Entities\Alert;
use Espo\ORM\EntityCollection;
use Espo\ORM\Query\Part\Condition;
use Espo\ORM\Query\Part\Expression;
use Espo\Tools\PopupNotification\Item;

class AlertManager
{
	public function __construct(
		private readonly Submission $webSocketSubmission,
		private readonly EntityManager $entityManager,
		private readonly Log $log
	) {
	}

	/**
	 * @return EntityCollection<Alert>
	 */
	public function getActive(?string $userId = null): EntityCollection
	{
		$cond = [
			'alertActive' => true,
			'deleted' => false,
		];

		if ($userId !== null) {
			$cond['userId'] = $userId;
		}

		$alertLinks = $this->entityManager
			->getRDBRepository(Alert::LINK_USER_NAME)
			->where($cond)
			->find();

		$alertIds = array_column($alertLinks->getValueMapList(), 'alertId');

		if (empty($alertIds)) {
			return new EntityCollection();
		}

		/** @var EntityCollection<Alert> $collection */
		$collection = $this->entityManager
			->getRDBRepository(Alert::ENTITY_TYPE)
			->where(Condition::in(Expression::column('id'), $alertIds))
			->find();

		return $collection;
	}

	public function submitWebSocketNotification(?string $userId, Alert $alert): ?Item
	{
		try {
			$item = $this->createNotificationItem($alert);
			$this->webSocketSubmission->submit(
				'popupNotifications.alert',
				$userId,
				(object) [
					'list' => [
						[
							'id' => $item->getId(),
							'data' => $item->getData(),
						],
					],
				]
			);

			return $item;
		} catch (\Exception $e) {
			$this->log->error('[viaCRM] Failed to submit Alert wss notification: ' . $e->getMessage());

			return null;
		}
	}

	private function createNotificationItem(Alert $alert): Item
	{
		$alertId = $alert->getId();
		$data = (object) [
			'id' => $alertId,
			'entityType' => 'Alert',
			'status' => $alert->getStatus(),
			'name' => $alert->get('name'),
			'message' => $alert->get('message'),
			'iconClass' => $alert->get('iconClass'),
			'soundEnabled' => true,
		];

		return new Item($alertId, $data);
	}
}
