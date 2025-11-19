<?php

namespace Espo\Modules\Autocrm\Core\Acl;

use Espo\Core\Acl\AccessChecker;
use Espo\Core\Acl\ScopeData;
use Espo\Entities\User;

interface AccessPrintChecker extends AccessChecker {

	/**
	 * Check 'print' access.
	 */
	public function checkPrint(User $user, ScopeData $data): bool;

}
