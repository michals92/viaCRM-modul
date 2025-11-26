<?php

namespace Espo\Modules\Viacrm\Tools\CustomIcon;

use Espo\Core\ORM\EntityManager;
use PDO;

class Service
{
	public function __construct(
		private readonly EntityManager $entityManager
	) {
	}

	/**
	 * @return string[]
	 */
	public function getCustomIconIdList(): array
	{
		$query = $this
			->entityManager
			->getQueryBuilder()
			->select('id')
			->from('CustomIcon')
			->build();

		return $this->entityManager->getQueryExecutor()->execute($query)->fetchAll(PDO::FETCH_COLUMN);
	}
}
