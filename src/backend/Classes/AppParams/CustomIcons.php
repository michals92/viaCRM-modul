<?php

namespace Espo\Modules\Viacrm\Classes\AppParams;

use Espo\Modules\Viacrm\Tools\CustomIcon\Service as CustomIconService;
use Espo\Tools\App\AppParam;

class CustomIcons implements AppParam {

	public function __construct(
		private readonly CustomIconService $customIconService
	) {}

	/**
	 * @return string[]
	 */
	public function get(): array {
		return $this->customIconService->getCustomIconIdList();
	}

}
