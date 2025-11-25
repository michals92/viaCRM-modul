<?php

namespace Espo\Modules\Viacrm\Controllers;

use Espo\Core\Acl;
use Espo\Core\Api\Request;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Record\SearchParamsFetcher;
use Espo\Core\Record\ServiceContainer as RecordServiceContainer;
use Espo\Core\Select\SearchParams;
use Espo\Core\Select\SelectBuilderFactory;
use Espo\ORM\Collection;
use Espo\ORM\Defs\RelationDefs;
use Espo\ORM\Entity;
use Espo\ORM\EntityCollection;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\Part\Expression as Expr;
use Espo\ORM\Repository\RDBSelectBuilder;
use stdClass;

class RelatedLinkLister {

	public function __construct(
		protected EntityManager $entityManager,
		protected Acl $acl,
		protected SearchParamsFetcher $searchParamsFetcher,
		protected SelectBuilderFactory $selectBuilderFactory,
		protected RecordServiceContainer $recordServiceContainer,
	) {}

	/**
	 * @throws BadRequest
	 * @throws Forbidden
	 */
	public function getActionListRelatedLink(Request $request): object {
		$parentScope = $request->getRouteParam('scope');
		$parentId = $request->getRouteParam('id');
		$parentLink = $request->getRouteParam('parentLink');
		$link = $request->getRouteParam('link');

		if (!$parentScope || !$parentId || !$parentLink || !$link) {
			throw new BadRequest();
		}

		$parentEntity = $this->entityManager->getEntityById($parentScope, $parentId) ?? throw new NotFound();

		$parentLinkRelation = $this->entityManager->getDefs()
		    ->getEntity($parentScope)
		    ->getRelation($parentLink);

		$parentLinkScope = $parentLinkRelation->getForeignEntityType();

		$linkRelation = $this->entityManager->getDefs()
		    ->getEntity($parentLinkScope)
		    ->getRelation($link);

		$linkScope = $linkRelation->getForeignEntityType();

		return $this->processRelation(
			$request,
			$parentEntity,
			$parentScope,
			$parentLink,
			$parentLinkScope,
			$link,
			$linkScope,
			$linkRelation,
			$parentLinkRelation
		);
	}

	/**
	 * Process the relation based on its type and configuration
	 */
	private function processRelation(
		Request $request,
		Entity $parentEntity,
		string $parentScope,
		string $parentLink,
		string $parentLinkScope,
		string $link,
		string $linkScope,
		RelationDefs $linkRelation,
		RelationDefs $parentLinkRelation
	): stdClass {
		if ($linkRelation->getType() === Entity::MANY_MANY && !$linkRelation->hasForeignRelationName()) {
			return $this->processManyManyWithoutForeignName(
				$request, $parentEntity, $parentScope, $parentLink, $parentLinkScope, $link, $linkScope, $linkRelation
			);
		}

		if (!$linkRelation->hasForeignRelationName()) {
			return $this->processWithoutForeignName(
				$request, $parentEntity, $parentScope, $parentLink, $parentLinkScope, $linkScope
			);
		}

		return $this->processWithForeignName(
			$request, $parentEntity, $parentScope, $parentLink, $parentLinkScope, $linkScope,
			$linkRelation, $parentLinkRelation
		);
	}

	/**
	 * Process many-to-many relation without foreign relation name
	 */
	private function processManyManyWithoutForeignName(
		Request $request,
		Entity $parentEntity,
		string $parentScope,
		string $parentLink,
		string $parentLinkScope,
		string $link,
		string $linkScope,
		RelationDefs $linkRelation
	): stdClass {
		if (!$linkRelation->hasRelationshipName()) {
			throw new \RuntimeException("No 'relationName' parameter defined in the relation '{$link}'.");
		}

		$parentRelatedEntities = $this->entityManager
		    ->getRelation($parentEntity, $parentLink)
		    ->find();

		$relatedEntityIds = $this->extractEntityIds($parentRelatedEntities);

		if (empty($relatedEntityIds)) {
			return $this->emptyResult();
		}

		$searchParams = $this->getSearchParams($request, $linkScope);
		$offset = $searchParams->getOffset() ?? 0;
		$limit = $searchParams->getMaxSize() ?? 5;

		$uniqueTargetIds = $this->collectUniqueTargetIds($parentLinkScope, $relatedEntityIds, $link);

		$totalCount = count($uniqueTargetIds);
		$paginatedTargetIds = array_slice($uniqueTargetIds, $offset, $limit);

		$targetEntities = $this->createTargetEntitiesCollection($linkScope, $paginatedTargetIds);

		return (object)[
		    'total' => $totalCount,
		    'list' => $targetEntities->getValueMapList()
		];
	}

	/**
	 * Process relation without foreign relation name
	 */
	private function processWithoutForeignName(
		Request $request,
		Entity $parentEntity,
		string $parentScope,
		string $parentLink,
		string $parentLinkScope,
		string $linkScope
	): stdClass {
		$parentRelatedEntities = $this->entityManager
		    ->getRelation($parentEntity, $parentLink)
		    ->find();

		$relatedEntityIds = $this->extractEntityIds($parentRelatedEntities);

		if (empty($relatedEntityIds)) {
			return $this->emptyResult();
		}

		$searchParams = $this->getSearchParams($request, $linkScope);

		$intermediateRelation = $this->findIntermediateRelation($parentLinkScope, $linkScope);

		if ($intermediateRelation) {
			return $this->processWithIntermediateRelation(
				$intermediateRelation['name'],
				$intermediateRelation['relation'],
				$searchParams,
				$linkScope,
				$relatedEntityIds
			);
		}

		return $this->emptyResult();
	}

	/**
	 * Process relation with foreign relation name
	 */
	private function processWithForeignName(
		Request $request,
		Entity $parentEntity,
		string $parentScope,
		string $parentLink,
		string $parentLinkScope,
		string $linkScope,
		RelationDefs $linkRelation,
		RelationDefs $parentLinkRelation
	): stdClass {
		$linkScopeForeignName = $linkRelation->getForeignRelationName();

		$this->checkAccess($parentEntity, $parentLinkScope, $linkScope);

		$searchParams = $this->getSearchParams($request, $linkScope);
		$builder = $this->createQueryBuilder($linkScope, $searchParams)
		    ->join($linkScopeForeignName);

		if ($linkRelation->getType() === Entity::MANY_MANY || $parentLinkRelation->getType() === Entity::MANY_MANY) {
			// Get the intermediate IDs (WorkPerformed IDs) first
			$intermediateIds = $this->getIntermediateIds($parentScope, $parentEntity, $parentLink);

			if (empty($intermediateIds)) {
				$builder->where(['id' => null]);
				$collection = $builder->distinct()->find();
				$resultCount = count($collection->getValueMapList());

				return (object)[
				    'total' => $resultCount,
				    'list' => $collection->getValueMapList(),
				];
			}

			// Use the relation that is actually many-to-many
			$relationToUse = $linkRelation->getType() === Entity::MANY_MANY ? $linkRelation : $parentLinkRelation;
			$relationshipName = $relationToUse->getRelationshipName();

			// For many-many relations, directly query the relationship table to get target IDs
			$targetIds = $this->getTargetIdsFromRelationshipTable(
				$relationshipName,
				$relationToUse->getMidKey(),
				$relationToUse->getForeignMidKey(),
				$intermediateIds
			);

			if (empty($targetIds)) {
				return $this->emptyResult();
			}

			// Simply filter by the target IDs
			$builder->where(['id=' => $targetIds]);
		} else {
			$intermediateIds = $this->getIntermediateIds($parentScope, $parentEntity, $parentLink);

			if (!empty($intermediateIds)) {
				$directCollection = $this->checkForDirectRelation($linkScope, $parentLinkScope, $intermediateIds);
				$directResultCount = count($directCollection->getValueMapList());

				if ($directResultCount > 0) {
					return (object)[
					    'total' => $directResultCount,
					    'list' => $directCollection->getValueMapList(),
					];
				}

				$this->applyIntermediateConditions($builder, $linkScopeForeignName, $parentLinkScope, $intermediateIds);
			} else {
				$builder->where(['id' => null]);
			}
		}

		$collection = $builder->distinct()->find();
		$resultCount = count($collection->getValueMapList());

		return (object)[
		    'total' => $resultCount,
		    'list' => $collection->getValueMapList(),
		];
	}

	/**
	 * Extract entity IDs from a collection
	 *
	 * @param  Collection<Entity> $entities
	 * @return string[]
	 */
	private function extractEntityIds(Collection $entities): array {
		$ids = [];
		foreach ($entities as $entity) {
			$ids[] = $entity->getId();
		}

		return $ids;
	}

	/**
	 * Return an empty result object
	 */
	private function emptyResult(): stdClass {
		return (object)['total' => 0, 'list' => []];
	}

	/**
	 * Get search parameters for the given scope
	 */
	private function getSearchParams(Request $request, string $scope): SearchParams {
		$searchParams = $this->searchParamsFetcher->fetch($request);
		$recordService = $this->recordServiceContainer->get($scope);

		return $recordService->prepareSearchParams($searchParams);
	}

	/**
	 * Collect unique target IDs from related entities
	 *
	 * @param  string   $parentLinkScope
	 * @param  string[] $relatedEntityIds
	 * @param  string   $link
	 * @return string[]
	 */
	private function collectUniqueTargetIds(string $parentLinkScope, array $relatedEntityIds, string $link): array {
		$uniqueTargetIds = [];

		foreach ($relatedEntityIds as $entityId) {
			$entity = $this->entityManager->getEntityById($parentLinkScope, $entityId);

			if (!$entity) {
				continue;
			}

			$relatedEntities = $this->entityManager
			    ->getRelation($entity, $link)
			    ->find();

			foreach ($relatedEntities as $relatedEntity) {
				$targetId = $relatedEntity->getId();

				if ($targetId && !in_array($targetId, $uniqueTargetIds)) {
					$uniqueTargetIds[] = $targetId;
				}
			}
		}

		return $uniqueTargetIds;
	}

	/**
	 * Create a collection of entities from a list of IDs
	 *
	 * @param  string                   $scope
	 * @param  string[]                 $ids
	 * @return EntityCollection<Entity>
	 */
	private function createTargetEntitiesCollection(string $scope, array $ids): EntityCollection {
		/** @var EntityCollection<Entity> $collection */
		$collection = $this->entityManager->getCollectionFactory()->create($scope);

		if (empty($ids)) {
			return $collection;
		}

		foreach ($ids as $id) {
			$entity = $this->entityManager->getEntityById($scope, $id);

			if (!$entity) {
				continue;
			}

			if (!$entity->get('deleted')) {
				$collection->append($entity);
			}
		}

		return $collection;
	}

	/**
	 * Find an intermediate relation between two scopes
	 *
	 * @return array{name: string, relation: RelationDefs}|null
	 */
	private function findIntermediateRelation(string $parentLinkScope, string $linkScope): ?array {
		$parentLinkScopeEntity = $this->entityManager->getDefs()->getEntity($parentLinkScope);
		$relationNames = array_keys($this->entityManager->getMetadata()->get($parentLinkScope, 'links') ?? []);

		foreach ($relationNames as $relationName) {
			if (!is_string($relationName)) {
				continue;
			}

			try {
				$relation = $parentLinkScopeEntity->getRelation($relationName);
				$foreignEntityType = $relation->getForeignEntityType();

				if ($foreignEntityType === $linkScope) {
					return [
					    'name' => $relationName,
					    'relation' => $relation
					];
				}
			} catch (\Exception $e) {
				continue;
			}
		}

		return null;
	}

	/**
	 * Process relation with an intermediate relation
	 *
	 * @param string       $relationName
	 * @param RelationDefs $relation
	 * @param SearchParams $searchParams
	 * @param string       $linkScope
	 * @param string[]     $relatedEntityIds
	 */
	private function processWithIntermediateRelation(
		string $relationName,
		RelationDefs $relation,
		SearchParams $searchParams,
		string $linkScope,
		array $relatedEntityIds
	): stdClass {
		$selectBuilder = $this->selectBuilderFactory->create();
		$selectBuilder->from($linkScope)
		    ->withSearchParams($searchParams)
		    ->withStrictAccessControl();

		$builder = $this->entityManager->getRDBRepository($linkScope)
		    ->clone($selectBuilder->build())
		    ->distinct();

		if ($relation->getType() === Entity::MANY_MANY) {
			$this->applyManyManyIntermediateConditions($builder, $relation, $relatedEntityIds);
		} else {
			$this->applyRegularIntermediateConditions($builder, $relation, $relationName, $relatedEntityIds);
		}

		$collection = $builder->find();
		$count = $builder->count();

		return (object)['total' => $count, 'list' => $collection->getValueMapList()];
	}

	/**
	 * Apply conditions for many-to-many intermediate relations
	 *
	 * @param RDBSelectBuilder<Entity> $builder
	 * @param RelationDefs             $relation
	 * @param string[]                 $relatedEntityIds
	 */
	private function applyManyManyIntermediateConditions(
		RDBSelectBuilder $builder,
		RelationDefs $relation,
		array $relatedEntityIds
	): void {
		$relationshipName = $relation->getRelationshipName();
		if ($relationshipName && is_string($relationshipName)) {
			$builder->join($relationshipName);
			$whereConditions = [
			    $relationshipName . '.' . $relation->getMidKey() . '=' => $relatedEntityIds,
			    'deleted' => false
			];
			$builder->where($whereConditions);
		}
	}

	/**
	 * Apply conditions for regular intermediate relations
	 *
	 * @param RDBSelectBuilder<Entity> $builder
	 * @param RelationDefs             $relation
	 * @param string                   $relationName
	 * @param string[]                 $relatedEntityIds
	 */
	private function applyRegularIntermediateConditions(
		RDBSelectBuilder $builder,
		RelationDefs $relation,
		string $relationName,
		array $relatedEntityIds
	): void {
		$foreignKey = $relation->getForeignKey();
		if ($foreignKey) {
			$builder->join($relationName);
			$whereConditions = [
			    $relationName . '.id=' => $relatedEntityIds,
			    'deleted' => false
			];
			$builder->where($whereConditions);
		}
	}

	/**
	 * Check access permissions for the entities
	 */
	private function checkAccess(Entity $parentEntity, string $parentLinkScope, string $linkScope): void {
		$parentEntityAccess = $this->acl->check($parentEntity);
		$parentLinkScopeAccess = $this->acl->checkScope($parentLinkScope);
		$linkScopeAccess = $this->acl->checkScope($linkScope);

		if (!$parentEntityAccess || !$parentLinkScopeAccess || !$linkScopeAccess) {
			throw new Forbidden();
		}
	}

	/**
	 * Create a query builder for the given scope and search parameters
	 *
	 * @param  string                   $scope
	 * @param  SearchParams             $searchParams
	 * @return RDBSelectBuilder<Entity>
	 */
	private function createQueryBuilder(string $scope, SearchParams $searchParams): RDBSelectBuilder {
		$selectBuilder = $this->selectBuilderFactory->create();

		$selectBuilder->from($scope)
		    ->withSearchParams($searchParams)
		    ->withStrictAccessControl();

		return $this->entityManager
		    ->getRDBRepository($scope)
		    ->clone($selectBuilder->build());
	}

	/**
	 * Get intermediate entity IDs
	 *
	 * @return string[]
	 */
	private function getIntermediateIds(string $parentScope, Entity $parentEntity, string $parentLink): array {
		$intermediateIds = [];

		$intermediateCollection = $this
			->entityManager
		    ->getRelation($parentEntity, $parentLink)
		    ->select(['id'])
		    ->where(['deleted' => false])
		    ->find();

		foreach ($intermediateCollection as $item) {
			$intermediateIds[] = $item->getId();
		}

		return $intermediateIds;
	}

	/**
	 * Check for direct relation between entities
	 *
	 * @param  string                   $linkScope
	 * @param  string                   $parentLinkScope
	 * @param  string[]                 $intermediateIds
	 * @return EntityCollection<Entity>
	 */
	private function checkForDirectRelation(string $linkScope, string $parentLinkScope, array $intermediateIds): EntityCollection {
		/** @var EntityCollection<Entity> $collection */
		$collection = $this->entityManager
		    ->getRDBRepository($linkScope)
		    ->where([
		        'parentType' => $parentLinkScope,
		        'parentId=' => $intermediateIds,
		        'deleted' => false
		    ])
		    ->find();

		return $collection;
	}

	/**
	 * Apply intermediate conditions to the query builder
	 *
	 * @param RDBSelectBuilder<Entity> $builder
	 * @param string                   $linkScopeForeignName
	 * @param string                   $parentLinkScope
	 * @param string[]                 $intermediateIds
	 */
	private function applyIntermediateConditions(
		RDBSelectBuilder $builder,
		string $linkScopeForeignName,
		string $parentLinkScope,
		array $intermediateIds
	): void {
		$whereConditions = [
		    $linkScopeForeignName . '.parentType' => $parentLinkScope,
		    $linkScopeForeignName . '.parentId=' => $intermediateIds,
		];

		$builder->where($whereConditions);
	}

	/**
	 * Get target entity IDs from a many-to-many relationship table
	 * 
	 * This method queries a many-to-many relationship table to find target entity IDs
	 * that are related to the given source IDs. It uses the EspoCRM QueryBuilder with
	 * Expression and Condition classes to build a proper SQL query.
	 *
	 * The query structure:
	 * - SELECT DISTINCT target_column FROM relationship_table
	 * - WHERE source_column IN (source_ids) AND deleted = 0
	 *
	 * Important implementation details:
	 * 1. We convert the target key to snake_case for the SQL column name
	 * 2. We use the original camelCase source key with Expr::column() for proper ORM mapping
	 * 3. We use Cond::in() to create a proper IN condition for the source IDs
	 * 4. The query is executed through the EntityManager's QueryExecutor
	 *
	 * @param  string   $relationshipName The name of the relationship table (e.g., "operationWorkPerformed")
	 * @param  string   $sourceKey        The camelCase attribute name for the source entity IDs (e.g., "workPerformedId")
	 * @param  string   $targetKey        The camelCase attribute name for the target entity IDs (e.g., "productionModelOperationId")
	 * @param  string[] $sourceIds        The source entity IDs to filter by
	 * @return string[] The target entity IDs that are related to the source IDs
	 */
	private function getTargetIdsFromRelationshipTable(
		string $relationshipName,
		string $sourceKey,
		string $targetKey,
		array $sourceIds
	): array {
		// Early return if no source IDs are provided
		if (empty($sourceIds)) {
			return [];
		}
        
		// Convert the target key to snake_case for the SQL column name
		// This is needed because database columns use snake_case
		$targetColumn = $this->convertToColumnName($targetKey);

		try {
			// Get the QueryBuilder instance from the EntityManager
			$queryBuilder = $this->entityManager->getQueryBuilder();

			// Build the query:
			// 1. Start with a SELECT query
			// 2. FROM the relationship table (using CamelCase for entity name)
			// 3. SELECT only the target column
			// 4. Use DISTINCT to avoid duplicate results
			// 5. WHERE source_column IN (source_ids)
			//    - Important: We use Expr::column($sourceKey) with the camelCase attribute name
			//    - This is because Expression::column() expects camelCase attribute names, not snake_case column names
			//    - Cond::in() creates a proper IN condition for the array of source IDs
			$query = $queryBuilder
			    ->select()
			    ->from(ucfirst($relationshipName))
			    ->select($targetColumn)
			    ->distinct()
			    ->where(
			    	Cond::in(Expr::column($sourceKey), $sourceIds)
			    )
			    ->build();

			// Get the actual SQL that will be executed for debugging
			$sql = $this->entityManager->getQueryComposer()->compose($query);
			$GLOBALS['log']->debug('RelatedLinkLister: Query SQL', [
			    'sql' => $sql
			]);

			// Execute the query and fetch the results as a single column
			$result = $this->entityManager
			    ->getQueryExecutor()
			    ->execute($query)
			    ->fetchAll(\PDO::FETCH_COLUMN);

			// Log the query results for debugging
			$GLOBALS['log']->debug('RelatedLinkLister: Query result', [
			    'resultCount' => count($result),
			    'result' => $result
			]);

			return $result;
		} catch (\Exception $e) {
			// Log any errors that occur during query execution
			$GLOBALS['log']->error('RelatedLinkLister: QueryBuilder approach failed', [
			    'error' => $e->getMessage(),
			    'trace' => $e->getTraceAsString()
			]);

			// Return an empty array if the query fails
			return [];
		}
	}

	/**
	 * Convert a camelCase property name to a snake_case column name
	 */
	private function convertToColumnName(string $propertyName): string {
		// Convert camelCase to snake_case
		$result = preg_replace('/(?<!^)[A-Z]/', '_$0', $propertyName);
		$columnName = strtolower($result !== null ? $result : $propertyName);

		return $columnName;
	}

}
