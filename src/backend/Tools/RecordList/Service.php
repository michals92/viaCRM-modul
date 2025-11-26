<?php

namespace Espo\Modules\Viacrm\Tools\RecordList;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Record\Collection as RecordCollection;
use Espo\Core\Record\ServiceContainer as RecordServiceContainer;
use Espo\Core\Select\SearchParams;

class Service
{
	public function __construct(
		private readonly RecordServiceContainer $recordServiceContainer
	) {
	}

	/**
	 * @throws Forbidden
	 * @throws NotFound
	 * @throws BadRequest
	 * @throws Error
	 *
	 * @return RecordCollection<\Espo\ORM\Entity>
	 */
	public function obtain(string $scope, string $id, string $link, SearchParams $searchParams): RecordCollection
	{
		$service = $this->recordServiceContainer->get($scope);
		$searchParams = $searchParams->withMaxSize(null);

		if (empty($link)) {
			throw new Error('Link parameter cannot be empty');
		}

		return $service->findLinked($id, $link, $searchParams);
	}
}
