<?php

namespace Espo\Modules\Viacrm\Classes\AppParams;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Select\SelectBuilder;
use Espo\Tools\App\AppParam;

class RoleList implements AppParam {
	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly SelectBuilder $selectBuilder
	) {}

	/**
	 * @throws BadRequest
	 * @throws Forbidden
	 * @return mixed
	 *
	 */
	public function get(): mixed {
		$query = $this
			->selectBuilder
			->from('Role')
			->withStrictAccessControl()
			->build();

		$roles = $this
			->entityManager
			->getRDBRepository('Role')
			->clone($query)
			->select(['id', 'name'])
			->find();

		return $roles->getValueMapList();
	}
}
