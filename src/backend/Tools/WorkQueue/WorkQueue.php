<?php

namespace Espo\Modules\Viacrm\Tools\WorkQueue;

use Espo\Core\Acl;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Error\Body as ErrorBody;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Record\Collection;
use Espo\Core\Select\SearchParams;
use Espo\Core\Select\SelectBuilderFactory;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Language;
use Espo\Core\Utils\Metadata;
use Espo\Entities\User;
use Espo\Modules\Viacrm\Entities\WorkQueue as WorkQueueEntity;
use Espo\ORM\EntityCollection;
use Espo\ORM\EntityManager;
use Espo\ORM\Query\Part\Expression;
use Espo\ORM\Query\Part\Selection;
use Espo\Tools\Kanban\GroupItem;
use Espo\Tools\Kanban\Result;
use Exception;
use LogicException;
use PDO;

class WorkQueue
{
	public function __construct(
		private readonly Metadata $metadata,
		private readonly EntityManager $entityManager,
		private readonly SelectBuilderFactory $selectBuilderFactory,
		private readonly Config $config,
		private readonly Language $language,
		private readonly Acl $acl,
		private readonly User $user
	) {
	}

	/**
	 * @throws Error|Exception
	 */
	public function getResult(string $userId, SearchParams $searchParams): Result
	{
		$workQueueEntityTypeList = $this->config->get('workQueueEntityTypeList', []);

		return $this->getResultInner($workQueueEntityTypeList, $userId, $searchParams);
	}

	/**
	 * @param string[]    $entityTypeList
	 * @param string      $userId
	 * @param string      $name
	 * @param string|null $label
	 * @param string|null $style
	 *
	 * @throws Error
	 * @throws Forbidden
	 * @throws BadRequest
	 *
	 * @return GroupItem
	 */
	public function fetchGroupWithName(
		array $entityTypeList,
		string $userId,
		string $name,
		SearchParams $searchParams,
		?string $label = null,
		?string $style = null
	): GroupItem {
		if (empty($entityTypeList)) {
			throw Error::createWithBody(
				"WorkQueue is not set up. name:$name",
				ErrorBody::create()
					->withMessageTranslation('workQueueNotSetUp', 'WorkQueue', [
						'name' => $name,
						'userId' => $userId,
					])
					->encode()
			);
		}

		$unionQuery = $this->entityManager->getQueryBuilder()->union();

		$level = $this->acl->getLevel('WorkQueue', 'read');

		$GLOBALS['log']->debug('rgkmlemrger', [$level]);

		$teamIdList = $this->user->getTeamIdList();
		$teamQuery = $this
			->entityManager
			->getQueryBuilder()
			->select('id')
			->from('User')
			->join('teams', 'Team')
			->where('Team.id', $teamIdList)
			->build();

		$assignedUserList = match ($level) {
			'team' => $this->entityManager->getQueryExecutor()->execute($teamQuery)->fetchAll(PDO::FETCH_COLUMN),
			'own' => [$this->user->getId()],
			default => null,
		};

		foreach ($entityTypeList as $entityType) {
			$statusField = $this->metadata->get(['scopes', $entityType, 'statusField']);

			if (!$statusField) {
				throw new Error('Status field is not defined for entity type: ' . $entityType);
			}

			$completedStatusList = $this->metadata->get(['scopes', $entityType, 'completedStatusList'], []);
			$canceledStatusList = $this->metadata->get(['scopes', $entityType, 'canceledStatusList'], []);
			$ongoingStatusList = $this->metadata->get(['scopes', $entityType, 'ongoingStatusList'], []);
			$kanbanStatusIgnoreList = $this->metadata->get(['scopes', $entityType, 'kanbanStatusIgnoreList'], []);

			/**
			 * @param \Espo\ORM\Query\SelectBuilder $query the query builder instance
			 *
			 * @return void
			 */
			$callback = static function ($query) use ($name, $statusField, $completedStatusList, $canceledStatusList, $ongoingStatusList, $kanbanStatusIgnoreList) {
				switch ($name) {
					case 'completed':
						$query->where(Expression::in(Expression::column($statusField), $completedStatusList));
						break;
					case 'ongoing':
						$query->where(Expression::in(Expression::column($statusField), $ongoingStatusList));
						break;
					case 'planned':
						$query->where(
							Expression::notIn(
								Expression::column($statusField),
								array_unique(array_merge($completedStatusList, $canceledStatusList, $ongoingStatusList, $kanbanStatusIgnoreList))
							)
						);
						break;
					default:
						throw new LogicException('Unknown group name: ' . $name);
				}
			};

			$query = $this->selectBuilderFactory
				->create()
				->from($entityType)
				->withStrictAccessControl()
				->withSearchParams($searchParams)
				->buildQueryBuilder()
				->select(
					Selection::create(
						Expression::value($entityType),
					),
					'scope'
				)
				->order([]);

			if ($assignedUserList) {
				$query = $query->where('assignedUserId', $assignedUserList);
			} else {
				$query = $query->where('assignedUserId!=', null);
			}

			$callback($query);

			$unionQuery->query($query->build());
		}

		if ($searchParams->getOrderBy() && $searchParams->getOrder()) {
			$unionQuery->order($searchParams->getOrderBy(), $searchParams->getOrder());
		}

		$result = $this
			->entityManager
			->getQueryExecutor()
			->execute($unionQuery->build())
			->fetchAll(PDO::FETCH_ASSOC);

		$entities = array_map(
			function ($attr) {
				$entity = new WorkQueueEntity(WorkQueueEntity::ENTITY_TYPE, /* So that getValueMapList Works properly */ ['attributes' => $attr]);

				$entity->setMultiple($attr);

				return $entity;
			},
			$result
		);

		$collection = new EntityCollection($entities, WorkQueueEntity::ENTITY_TYPE);

		return new GroupItem(
			$name,
			Collection::createNoCount($collection, null),
			$label,
			$style
		);
	}

	/**
	 * @param string[] $entityTypeList
	 * @param string   $userId
	 *
	 * @throws BadRequest
	 * @throws Error
	 * @throws Forbidden
	 *
	 * @return Result
	 */
	public function getResultInner(array $entityTypeList, string $userId, SearchParams $searchParams): Result
	{
		if (empty($entityTypeList)) {
			return new Result([], Collection::TOTAL_HAS_NO_MORE);
		}

		$completedLabel = $this->language->translateLabel('Completed', scope: 'WorkQueue');
		$completed = $this->fetchGroupWithName(
			$entityTypeList,
			$userId,
			'completed',
			$searchParams,
			$completedLabel,
			'success'
		);
		$ongoingLabel = $this->language->translateLabel('Ongoing', scope: 'WorkQueue');
		$ongoing = $this->fetchGroupWithName(
			$entityTypeList,
			$userId,
			'ongoing',
			$searchParams,
			$ongoingLabel,
			'warning'
		);
		$plannedLabel = $this->language->translateLabel('Planned', scope: 'WorkQueue');
		$planned = $this->fetchGroupWithName(
			$entityTypeList,
			$userId,
			'planned',
			$searchParams,
			$plannedLabel,
			'info'
		);

		return new Result([
			$planned,
			$ongoing,
			$completed,
		], Collection::TOTAL_HAS_MORE);
	}
}
