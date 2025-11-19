<?php

namespace Espo\Modules\Autocrm\Tools\Aggregation;

use Espo\Core\Exceptions\NotFound;
use Espo\Core\Select\SelectBuilderFactory;
use Espo\ORM\EntityManager;
use stdClass;

class Service {

	public function __construct(
		private readonly SelectBuilderFactory $selectBuilderFactory,
		private readonly AggregationFunctionFactory $aggregationFunctionFactory,
		private readonly EntityManager $entityManager,
	) {}

	/**
	 * @throws NotFound
	 */
	public function aggregate(Params $params): stdClass {
		$entityType = $params->getEntityType();
		$selectBuilder = $this->selectBuilderFactory
		    ->create()
		    ->from($entityType)
		    ->withStrictAccessControl();

		if ($params->hasSearchParams()) {
			$selectBuilder->withSearchParams($params->getSearchParams());
		}

		$queryBuilder = $selectBuilder->buildQueryBuilder()->order([]);

		foreach ($params->getEntries() as $entry) {
			$function = $this->aggregationFunctionFactory->create($entry->getFunction(), $entityType);

			$function->aggregate($entry->getName(), $entry->getFunction(), $entry->getField(), $queryBuilder);
		}

		$query = $queryBuilder->build();

		$result = $this->entityManager->getQueryExecutor()->execute($query)->fetchObject();

		return $result !== false ? $result : new stdClass();
	}

}
