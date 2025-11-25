<?php

namespace Espo\Modules\Viacrm\Tools\Partition;

use Espo\Core\Acl\Table;
use Espo\Core\AclManager;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\ForbiddenSilent;
use Espo\Core\Select\SearchParams;
use Espo\Core\Utils\Metadata;
use Espo\Entities\User;
use Espo\Tools\Kanban\Result;

class PartitionService {

	public function __construct(
		private readonly AclManager $aclManager,
		private readonly Metadata $metadata,
		private readonly Partition $partition,
		private readonly User $user,
	) {}

	/**
	 * @throws Error
	 * @throws ForbiddenSilent
	 */
	public function getData(string $entityType, SearchParams $searchParams, string $by): Result {
		$this->processAccessCheck($entityType);

		$disableCount = $this->metadata
		    ->get(['entityDefs', $entityType, 'collection', 'countDisabled']) ?? false;

		return $this->partition
		    ->setEntityType($entityType)
		    ->setStatusField($by)
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

}
