<?php

namespace Espo\Modules\Autocrm\Classes\AppParams;

use Espo\Entities\Extension;
use Espo\Entities\User;
use Espo\ORM\EntityManager;
use Espo\Tools\App\AppParam;
use stdClass;

class Extensions implements AppParam {

	public function __construct(
		protected readonly User $user,
		protected readonly EntityManager $entityManager
	) {}

	/**
	 * @return stdClass[]
	 */
	public function get(): array {
		if (!$this->user->isRegular() && !$this->user->isAdmin()) {
			return [];
		}

		$extensionList = $this->entityManager
		    ->getRDBRepository(Extension::ENTITY_TYPE)
		    ->where([
		        'licenseStatus' => [
		            Extension::LICENSE_STATUS_INVALID,
		            Extension::LICENSE_STATUS_EXPIRED,
		            Extension::LICENSE_STATUS_SOFT_EXPIRED,
		        ],
		    ])
		    ->find();

		$list = [];

		foreach ($extensionList as $extension) {
			$list[] = (object) [
			    'name' => $extension->getName(),
			    'version' => $extension->getVersion(),
			    'licenseStatus' => $extension->getLicenseStatus(),
			    'licenseStatusMessage' => $extension->getLicenseStatusMessage(),
			    'isInstalled' => $extension->isInstalled(),
			    'notify' => false,/*in_array(
                    $extension->getLicenseStatus(),
                    [
                        Extension::LICENSE_STATUS_INVALID,
                        Extension::LICENSE_STATUS_EXPIRED,
                    ]
                )*/
			];
		}

		return $list;
	}

}
