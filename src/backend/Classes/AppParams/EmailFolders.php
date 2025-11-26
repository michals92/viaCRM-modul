<?php

namespace Espo\Modules\Viacrm\Classes\AppParams;

use Espo\Core\Exceptions\ForbiddenSilent;
use Espo\Core\Exceptions\NotFound;
use Espo\Tools\App\AppParam;
use Espo\Tools\EmailFolder\Service as EmailFolderService;

class EmailFolders implements AppParam
{
	public function __construct(
		private readonly EmailFolderService $emailFolderService
	) {
	}

	/**
	 * @throws ForbiddenSilent
	 * @throws NotFound
	 */
	public function get(): mixed
	{
		return $this->emailFolderService->listAll();
	}
}
