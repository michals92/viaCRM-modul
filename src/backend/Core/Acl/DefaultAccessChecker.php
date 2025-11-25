<?php

namespace Espo\Modules\Viacrm\Core\Acl;

use Espo\Core\Acl\ScopeData;
use Espo\Entities\User;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Entity;

class DefaultAccessChecker extends \Espo\Core\Acl\DefaultAccessChecker implements

	AccessPrintChecker,
	AccessEntityPrintChecker {

	public function checkPrint(User $user, ScopeData $data): bool {
		return ReflectionUtil::callClassMethod(parent::class, $this, 'checkScope', $data, 'print');
	}

	public function checkEntityPrint(User $user, Entity $entity, ScopeData $data): bool {
		return ReflectionUtil::callClassMethod(parent::class, $this, 'checkEntity', $user, $entity, $data, 'print');
	}

}