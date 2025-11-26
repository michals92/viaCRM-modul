<?php

namespace Espo\Modules\Viacrm\Core\Record;

use Espo\Core\Api\Request;
use Espo\Core\Record\DeleteParams;
use Espo\Core\Record\DeleteParamsFetcher;

class EntityAwareDeleteParamsFetcher extends DeleteParamsFetcher {
	/**
	 * @use ParamsFetcherTrait<DeleteParamsFetcher, DeleteParams>
	 */
	use ParamsFetcherTrait;

	protected string $type = 'delete';

	/**
	 * @throws \Exception
	 */
	public function fetch(Request $request): DeleteParams {
		/**
		 * @var DeleteParams
		 */
		return $this->fetchInternal($request);
	}
}