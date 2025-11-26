<?php

namespace Espo\Modules\Viacrm\Classes\AppParams;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Select\SelectBuilderFactory;
use Espo\Modules\Viacrm\Entities\RecordRecurrence;
use Espo\ORM\EntityManager;
use Espo\Tools\App\AppParam;

readonly class RecurringRecordsEntityList implements AppParam
{
	public function __construct(
		private SelectBuilderFactory $selectBuilderFactory,
		private EntityManager $entityManager,
	) {
	}

	/**
	 * @throws BadRequest
	 * @throws Forbidden
	 *
	 * @return string[]
	 */
	public function get(): array
	{
		$list = [];

		$query = $this
			->selectBuilderFactory
			->create()
			->from(RecordRecurrence::ENTITY_TYPE)
			->withStrictAccessControl()
			->buildQueryBuilder()
			->select(['entityType'])
			->group(['entityType'])
			->where('entityType!=', null)
			->build();

		$recurrences = $this->entityManager
			->getRDBRepository(RecordRecurrence::ENTITY_TYPE)
			->clone($query)
			->find();

		foreach ($recurrences as $record) {
			$list[] = $record->get('entityType');
		}

		return $list;
	}
}
