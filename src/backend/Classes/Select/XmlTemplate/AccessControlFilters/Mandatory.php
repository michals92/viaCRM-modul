<?php

namespace Espo\Modules\Viacrm\Classes\Select\XmlTemplate\AccessControlFilters;

use Espo\Core\Acl\Exceptions\NotImplemented;
use Espo\Core\AclManager;
use Espo\Core\Select\AccessControl\Filter;
use Espo\Entities\User;
use Espo\ORM\Defs;
use Espo\ORM\Query\SelectBuilder;

class Mandatory implements Filter
{
	public function __construct(
		private readonly User $user,
		private readonly Defs $defs,
		private readonly AclManager $aclManager
	) {
	}

	public function apply(SelectBuilder $queryBuilder): void
	{
		if ($this->user->isAdmin()) {
			return;
		}

		$forbiddenEntityTypeList = [];

		foreach ($this->defs->getEntityTypeList() as $entityType) {
			try {
				if (!$this->aclManager->checkScope($this->user, $entityType)) {
					$forbiddenEntityTypeList[] = $entityType;
				}
			} catch (NotImplemented) {
			}
		}

		if (empty($forbiddenEntityTypeList)) {
			return;
		}

		$queryBuilder->where([
			'entityType!=' => $forbiddenEntityTypeList,
		]);
	}
}
