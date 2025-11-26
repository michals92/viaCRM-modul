<?php

namespace Espo\Modules\Viacrm\Classes\AppParams;

use Espo\Core\ORM\EntityManager;
use Espo\Core\Select\SelectBuilder;
use Espo\Tools\App\AppParam;

class UserList implements AppParam {
	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly SelectBuilder $selectBuilder
	) {}

	public function get(): mixed {
		$query = $this
		    ->selectBuilder
		    ->from('User')
		    ->withStrictAccessControl()
		    ->build();

		$users = $this
		    ->entityManager
		    ->getRDBRepository('User')
		    ->clone($query)
		    ->select(['id', 'name'])
		    ->where('isActive', true)
		    ->where('type!=', ['portal', 'system', 'api'])
		    ->find();

		return $users->getValueMapList();
	}
}
