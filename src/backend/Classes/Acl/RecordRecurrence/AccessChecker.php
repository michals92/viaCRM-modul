<?php

namespace Espo\Modules\Viacrm\Classes\Acl\RecordRecurrence;

use Espo\Core\Acl\AccessEntityCREDSChecker;
use Espo\Core\Acl\DefaultAccessChecker;
use Espo\Core\Acl\ScopeData;
use Espo\Core\Acl\Table;
use Espo\Core\Acl\Traits\DefaultAccessCheckerDependency;
use Espo\Core\AclManager;
use Espo\Entities\User;
use Espo\Modules\Viacrm\Entities\RecordRecurrence;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * @implements AccessEntityCREDSChecker<RecordRecurrence>
 */
class AccessChecker implements AccessEntityCREDSChecker {
	use DefaultAccessCheckerDependency;

	public function __construct(
		DefaultAccessChecker $defaultAccessChecker,
		private readonly AclManager $aclManager,
		private readonly EntityManager $entityManager,
	) {
		$this->defaultAccessChecker = $defaultAccessChecker;
	}

	public function checkEntityCreate(User $user, Entity $entity, ScopeData $data): bool {
		if (!$this->defaultAccessChecker->checkEntityCreate($user, $entity, $data)) {
			return false;
		}

		$data = $entity->get('data');
		$entityType = $entity->get('entityType');

		if (!$this->aclManager->checkScope($user, $entityType, Table::ACTION_CREATE)) {
			return false;
		}

		if (isset($data->id)) {
			$target = $this->entityManager->getEntityById($entityType, $data->id);
			if ($target === null || !$this->aclManager->checkEntity($user, $target)) {
				return false;
			}
		}

		return true;
	}
}