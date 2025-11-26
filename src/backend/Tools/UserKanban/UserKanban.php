<?php

namespace Espo\Modules\Viacrm\Tools\UserKanban;

use Espo\Core\Exceptions\Error;
use Espo\Core\FieldProcessing\ListLoadProcessor;
use Espo\Core\FieldProcessing\Loader\Params as LoaderParams;
use Espo\Core\Record\Collection;
use Espo\Core\Record\ServiceContainer as RecordServiceContainer;
use Espo\Core\Select\Applier\Factory as SelectApplierFactory;
use Espo\Core\Select\SearchParams;
use Espo\Core\Select\SelectBuilderFactory;
use Espo\Core\Select\Where\Item as WhereItem;
use Espo\Core\Select\Where\Params as WhereParams;
use Espo\Core\Utils\Metadata;
use Espo\Entities\User;
use Espo\EntryPoints\Avatar;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Collection as ORMCollection;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Query\Part\Expression;
use Espo\Tools\Kanban\Result;
use RuntimeException;

class UserKanban {
	private ?string $entityType = null;

	private bool $countDisabled = false;

	private bool $orderDisabled = false;

	private ?SearchParams $searchParams = null;

	private ?string $userId = null;

	private const DEFAULT_MAX_ORDER_NUMBER = 50;

	private int $maxOrderNumber = self::DEFAULT_MAX_ORDER_NUMBER;

	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly SelectBuilderFactory $selectBuilderFactory,
		private readonly ListLoadProcessor $listLoadProcessor,
		private readonly RecordServiceContainer $recordServiceContainer,
		private readonly SelectApplierFactory $selectApplierFactory,
		private readonly Metadata $metadata,
		private readonly User $user,
		private readonly Avatar $avatarEntryPoint,
	) {}

	public function setEntityType(string $entityType): self {
		$this->entityType = $entityType;

		return $this;
	}

	public function setSearchParams(SearchParams $searchParams): self {
		$this->searchParams = $searchParams;

		return $this;
	}

	public function setCountDisabled(bool $countDisabled): self {
		$this->countDisabled = $countDisabled;

		return $this;
	}

	public function setUserId(string $userId): self {
		$this->userId = $userId;

		return $this;
	}

	/**
	 * @throws Error
	 */
	public function getResult(): Result {
		if (!$this->entityType) {
			throw new Error('Entity type is not specified.');
		}

		if (!$this->searchParams) {
			throw new Error('No search params.');
		}

		$searchParams = $this->searchParams;

		$where = $searchParams->getWhere()?->getValue();

		$userWhere = null;

		if ($where) {
			if (is_array($where)) {
				foreach ($where as $item) {
					if ($item['attribute'] === 'assignedUserId') {
						$userWhere = $item;
						$userWhere['attribute'] = 'id';
					}
				}
			}
		}

		$recordService = $this->recordServiceContainer->get($this->entityType);

		$maxSize = $searchParams->getMaxSize();

		if ($this->countDisabled && $maxSize) {
			$searchParams = $searchParams->withMaxSize($maxSize + 1);
		}

		$query = $this->selectBuilderFactory
		    ->create()
		    ->from($this->entityType)
		    ->withStrictAccessControl()
		    ->withSearchParams($searchParams)
		    ->buildQueryBuilder();

		$statusField = $this->metadata->get(['scopes', $this->entityType, 'statusField'], null);
		$userKanbanStatusIgnoreList = $this->metadata->get(['scopes', $this->entityType, 'userKanbanStatusIgnoreList'], []);

		if ($statusField && !empty($userKanbanStatusIgnoreList)) {
			$query->where(Expression::notIn(Expression::column($statusField),  $userKanbanStatusIgnoreList));
		}

		$query = $query->build();

		$collection = $this->entityManager
		    ->getCollectionFactory()
		    ->create($this->entityType);

		$users = $this->getUsers($userWhere);

		$groupList = [];

		$repository = $this->entityManager->getRDBRepository($this->entityType);

		$hasMore = false;

		foreach ($users as $user) {
			$userId = $user->getId();

			$itemSelectBuilder = $this->entityManager
			    ->getQueryBuilder()
			    ->select()
			    ->clone($query);

			$itemSelectBuilder->where([
			    'assignedUserId' => $userId,
			]);

			$itemQuery = $itemSelectBuilder->build();
			$newOrder = $itemQuery->getOrder();

			array_unshift($newOrder, [
				'COALESCE:(userKanbanOrder.order, ' . ($this->maxOrderNumber + 1) . ')',
				'ASC',
			]);

			if ($this->userId && !$this->orderDisabled) {
				$itemQuery = $this->entityManager
				    ->getQueryBuilder()
				    ->select()
				    ->clone($itemQuery)
					->order($newOrder)
					->leftJoin(
						'UserKanbanOrder',
						'userKanbanOrder',
						[
							'userKanbanOrder.entityType' => $this->entityType,
							'userKanbanOrder.entityId:' => 'id',
							'userKanbanOrder.group' => $userId,
							'userKanbanOrder.userId' => $this->userId,
						]
					)
					->build();
			}

			$collectionSub = $repository
			    ->clone($itemQuery)
			    ->find();

			if (!$this->countDisabled) {
				$totalSub = $repository->clone($itemQuery)->count();
			} else {
				$recordCollection = Collection::createNoCount($collectionSub, $maxSize);

				$collectionSub = $recordCollection->getCollection();
				$totalSub = $recordCollection->getTotal();

				if ($totalSub === Collection::TOTAL_HAS_MORE) {
					$hasMore = true;
				}
			}

			$loadProcessorParams = LoaderParams
			    ::create()
			    ->withSelect($searchParams->getSelect());

			foreach ($collectionSub as $e) {
				$this->listLoadProcessor->process($e, $loadProcessorParams);

				$recordService->prepareEntityForOutput($e);

				$collection[] = $e;
			}

			/** @var Collection<Entity> $itemRecordCollection */
			$itemRecordCollection = new Collection($collectionSub, $totalSub);

			$color = ReflectionUtil::callMethod($this->avatarEntryPoint, 'getColor', $user);

			$groupList[] = new GroupItem($userId, $itemRecordCollection, $user->get('name'), color: $color);
		}

		$total = !$this->countDisabled ?
		    $repository->clone($query)->count() : ($hasMore ? Collection::TOTAL_HAS_MORE : Collection::TOTAL_HAS_NO_MORE);

		return new Result($groupList, $total);
	}

	/**
	 * @param  array<string, mixed>|null $userWhere
	 * @throws Error
	 * @return ORMCollection<User>
	 */
	private function getUsers(?array $userWhere): ORMCollection {
		$query = $this
		    ->selectBuilderFactory
		    ->create()
		    ->from(User::ENTITY_TYPE)
		    ->withStrictAccessControl()
		    ->buildQueryBuilder();

		$query = $query
		    ->where('isActive', true)
		    ->where('type!=', ['portal', 'system', 'api']);

		if ($userWhere) {
			$entityType = $this->entityType ?? throw new RuntimeException('Entity type is not specified.');

			$whereApplier = $this->selectApplierFactory->createWhere($entityType, $this->user);

			$whereApplier->apply($query, WhereItem::fromRaw($userWhere), WhereParams::fromAssoc([]));
		}

		return $this
		    ->entityManager
		    ->getRDBRepository(User::ENTITY_TYPE)
			->clone($query->build())
			->find();
	}
}
