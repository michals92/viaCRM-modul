<?php

namespace Espo\Modules\Viacrm\Tools\WorkQueue;

use Espo\Core\Exceptions\Error;
use Espo\Core\Select\SearchParams;
use Espo\Entities\User;
use Espo\Tools\Kanban\Result;

class Service {
	public function __construct(
		private readonly WorkQueue $workQueue,
		private readonly User      $user,
	) {}

	/**
	 * @throws Error
	 */
	public function getData(SearchParams $searchParams): Result {
		return $this->workQueue
			->getResult(
				$this->user->getId(),
				$searchParams
			);
	}
}
