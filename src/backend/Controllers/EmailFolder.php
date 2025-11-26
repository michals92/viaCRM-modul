<?php

namespace Espo\Modules\Viacrm\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Modules\Viacrm\Tools\EmailFolder\Service as ViacrmEmailFolderService;
use stdClass;

class EmailFolder extends \Espo\Controllers\EmailFolder
{
	/**
	 * @throws Forbidden
	 * @throws NotFound
	 */
	public function getActionListAll(Request $request): stdClass
	{
		$userId = $request->getQueryParam('userId');

		$list = $this->getEmailFolderService()->listAll($userId);

		return (object) ['list' => $list];
	}

	private function getEmailFolderService(): ViacrmEmailFolderService
	{
		return $this->injectableFactory->create(ViacrmEmailFolderService::class);
	}
}
