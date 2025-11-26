<?php

namespace Espo\Modules\Viacrm\Classes\AppParams;

use Espo\Core\ORM\EntityManager;
use Espo\ORM\Query\Part\Expression;
use Espo\Tools\App\AppParam;
use PDO;

/**
 * AppParam to provide a mapping of team IDs to their styles (color and iconClass).
 */
class TeamStyles implements AppParam
{
	public function __construct(
		private readonly EntityManager $entityManager
	) {
	}

	/**
	 * Retrieves a map of team IDs to their respective color and iconClass.
	 *
	 * @return array<string, array<string, string>> the team styles map
	 */
	public function get(): array
	{
		$query = $this->entityManager->getQueryBuilder()
			->select(Expression::column('id'))
			->select(Expression::column('color'))
			->select(Expression::column('iconClass'))
			->from('Team')
			->build();

		return $this
			->entityManager
			->getQueryExecutor()
			->execute($query)
			->fetchAll(PDO::FETCH_UNIQUE | PDO::FETCH_OBJ);
	}
}
