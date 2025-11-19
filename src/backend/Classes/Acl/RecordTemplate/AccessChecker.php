<?php

namespace Espo\Modules\Autocrm\Classes\Acl\RecordTemplate;

use Espo\Core\Acl\AccessEntityCREDSChecker;
use Espo\Core\Acl\DefaultAccessChecker;
use Espo\Core\Acl\ScopeData;
use Espo\Core\Acl\Table;
use Espo\Core\Acl\Traits\DefaultAccessCheckerDependency;
use Espo\Core\AclManager;
use Espo\Entities\User;
use Espo\Modules\Autocrm\Entities\RecordTemplate;
use Espo\ORM\Entity;

/**
 * @implements AccessEntityCREDSChecker<RecordTemplate>
 */
class AccessChecker implements AccessEntityCREDSChecker {
	use DefaultAccessCheckerDependency;

	public function __construct(
		DefaultAccessChecker $defaultAccessChecker,
		private readonly AclManager $aclManager,
	) {
		$this->defaultAccessChecker = $defaultAccessChecker;
	}

	public function checkEntityRead(User $user, Entity $entity, ScopeData $data): bool {
		$scope = $entity->get('entityType');

		return !$scope || $this->aclManager->checkScope($user, $scope, TABLE::ACTION_READ);
	}

}