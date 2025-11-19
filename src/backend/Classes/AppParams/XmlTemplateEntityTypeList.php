<?php

namespace Espo\Modules\Autocrm\Classes\AppParams;

use Espo\Core\Acl;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Select\SelectBuilderFactory;
use Espo\Modules\Autocrm\Entities\XmlTemplate;
use Espo\Tools\App\AppParam;
use PDO;

class XmlTemplateEntityTypeList implements AppParam {

	public function __construct(
		private readonly Acl $acl,
		private readonly SelectBuilderFactory $selectBuilderFactory,
		private readonly EntityManager $entityManager
	) {}

	/**
	 * @throws BadRequest
	 * @throws Error
	 * @throws Forbidden
	 * @return string[]
	 */
	public function get(): array {
		if (!$this->acl->checkScope(XmlTemplate::ENTITY_TYPE)) {
			return [];
		}

		$query = $this->selectBuilderFactory
		    ->create()
		    ->from(XmlTemplate::ENTITY_TYPE)
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
