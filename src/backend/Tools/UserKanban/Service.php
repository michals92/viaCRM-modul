<?php

namespace Espo\Modules\Viacrm\Tools\UserKanban;

use Espo\Core\Acl\Table;
use Espo\Core\AclManager;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\ForbiddenSilent;
use Espo\Core\Select\SearchParams;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Metadata;
use Espo\Entities\User;
use Espo\Tools\Kanban\Result;

class Service {
	public function __construct(
		private readonly AclManager $aclManager,
		private readonly Metadata $metadata,
		private readonly UserKanban $userKanban,
		private readonly User $user,
		private readonly UserOrderer $userOrderer,
		private readonly Config $config
	) {}

	/**
	 * @throws Error
	 * @throws ForbiddenSilent
	 */
	public function getData(string $entityType, SearchParams $searchParams): Result {
		$this->processAccessCheck($entityType);

		$disableCount = $this->metadata
		    ->get(['entityDefs', $entityType, 'collection', 'countDisabled']) ?? false;

		return $this->userKanban
		    ->setEntityType($entityType)
		    ->setSearchParams($searchParams)
		    ->setCountDisabled($disableCount)
		    ->setUserId($this->user->getId())
		    ->getResult();
	}

	/**
	 * @throws ForbiddenSilent
	 */
	protected function processAccessCheck(string $entityType): void {
		if (!$this->aclManager->check($this->user, $entityType, Table::ACTION_READ)) {
			throw new ForbiddenSilent();
		}
	}

	/**
	 * @param string[] $ids
	 *
	 * @throws ForbiddenSilent
	 */
	public function order(string $entityType, string $group, array $ids): void {
		$this->processAccessCheck($entityType);

		if ($this->user->isPortal()) {
			throw new ForbiddenSilent('Kanban order is not allowed for portal users.');
		}

		$maxOrderNumber = $this->config->get('kanbanMaxOrderNumber');

		$this->userOrderer
			->setEntityType($entityType)
			->setGroup($group)
			->setUserId($this->user->getId())
			->setMaxNumber($maxOrderNumber)
			->order($ids);
	}
}
