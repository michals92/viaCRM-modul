<?php

namespace Espo\Modules\Viacrm\Core\Record;

use Espo\Core\Api\Request;
use Espo\Core\Record\ReadParams;
use Espo\Core\Record\ReadParamsFetcher;

class EntityAwareReadParamsFetcher extends ReadParamsFetcher
{
	/**
	 * @use ParamsFetcherTrait<ReadParamsFetcher, ReadParams>
	 */
	use ParamsFetcherTrait;

	protected string $type = 'read';

	/**
	 * @throws \Exception
	 */
	public function fetch(Request $request): ReadParams
	{
		/**
		 * @var ReadParams
		 */
		return $this->fetchInternal($request);
	}
}
