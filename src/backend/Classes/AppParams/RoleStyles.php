<?php

namespace Espo\Modules\Viacrm\Classes\AppParams;

use Espo\Core\ORM\EntityManager;
use Espo\ORM\Query\Part\Expression;
use Espo\Tools\App\AppParam;
use PDO;

/**
 * AppParam to provide a mapping of role IDs to their styles (color and iconClass).
 */
class RoleStyles implements AppParam {
	public function __construct(
		private readonly EntityManager $entityManager
	) {}

	/**
	 * Retrieves a map of role IDs to their respective color and iconClass.
	 *
	 * @return array<string, array<string, string>> The role styles map.
	 */
	public function get(): array {
		$query = $this->entityManager->getQueryBuilder()
		    ->select(Expression::column('id'))
		    ->select(Expression::column('color'))
		    ->select(Expression::column('iconClass'))
		    ->from('Role')
		    ->build();

		return $this
		    ->entityManager
		    ->getQueryExecutor()
		    ->execute($query)
		    ->fetchAll(PDO::FETCH_UNIQUE | PDO::FETCH_OBJ);
	}
}
