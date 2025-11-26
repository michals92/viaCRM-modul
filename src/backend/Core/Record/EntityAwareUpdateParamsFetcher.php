<?php

namespace Espo\Modules\Viacrm\Core\Record;

use Espo\Core\Api\Request;
use Espo\Core\Record\UpdateParams;
use Espo\Core\Record\UpdateParamsFetcher;

class EntityAwareUpdateParamsFetcher extends UpdateParamsFetcher
{
	/**
	 * @use ParamsFetcherTrait<UpdateParamsFetcher, UpdateParams>
	 */
	use ParamsFetcherTrait;

	protected string $type = 'update';

	/**
	 * @throws \Exception
	 */
	public function fetch(Request $request): UpdateParams
	{
		/**
		 * @var UpdateParams
		 */
		return $this->fetchInternal($request);
	}
}
