<?php

namespace Espo\Modules\Viacrm\Classes\AppParams;

use Espo\Core\Acl;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Select\SelectBuilderFactory;
use Espo\Entities\Template;
use Espo\Tools\App\AppParam;
use PDO;

/** A more optimized and error-resistant version of the original */
class TemplateEntityTypeList implements AppParam
{
	public function __construct(
		private readonly Acl $acl,
		private readonly SelectBuilderFactory $selectBuilderFactory,
		private readonly EntityManager $entityManager
	) {
	}

	public function get(): mixed
	{
		if (!$this->acl->checkScope(Template::ENTITY_TYPE)) {
			return [];
		}

		$query = $this->selectBuilderFactory
			->create()
			->from(Template::ENTITY_TYPE)
			->withAccessControlFilter()
			->buildQueryBuilder()
			->select(['entityType'])
			->distinct()
			->where('entityType!=', null)
			->build();

		return $this
			->entityManager
			->getQueryExecutor()
			->execute($query)
			->fetchAll(PDO::FETCH_COLUMN);
	}
}
