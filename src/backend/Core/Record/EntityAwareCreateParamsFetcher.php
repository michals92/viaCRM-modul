<?php

namespace Espo\Modules\Autocrm\Core\Record;

use Espo\Core\Api\Request;
use Espo\Core\Record\CreateParams;
use Espo\Core\Record\CreateParamsFetcher;

class EntityAwareCreateParamsFetcher extends CreateParamsFetcher {
	/**
	 * @use ParamsFetcherTrait<CreateParamsFetcher, CreateParams>
	 */
	use ParamsFetcherTrait;

	protected string $type = 'create';

	/**
	 * @throws \Exception
	 */
	public function fetch(Request $request): CreateParams {
		/**
		 * @var CreateParams
		 */
		return $this->fetchInternal($request);
	}

}