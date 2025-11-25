<?php

namespace Espo\Modules\Viacrm\Tools\UserKanban;

use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Id\RecordIdGenerator;
use Espo\Core\Utils\Metadata;
use Espo\Modules\Viacrm\Entities\UserKanbanOrder;
use LogicException;

class UserOrdererProcessor {

	private const MAX_GROUP_LENGTH = 100;
	private const DEFAULT_MAX_NUMBER = 50;

	private ?string $entityType = null;

	private ?string $group = null;

	private ?string $userId = null;

	private int $maxNumber = self::DEFAULT_MAX_NUMBER;

	public function __construct(
		private EntityManager $entityManager,
		private Metadata $metadata,
		private RecordIdGenerator $idGenerator
	) {}

	public function setEntityType(string $entityType): self {
		$this->entityType = $entityType;

		return $this;
	}

	public function setGroup(string $group): self {
		$this->group = mb_substr($group, 0, self::MAX_GROUP_LENGTH);

		return $this;
	}

	public function setUserId(string $userId): self {
		$this->userId = $userId;

		return $this;
	}

	public function setMaxNumber(?int $maxNumber): self {
		if ($maxNumber === null) {
			$this->maxNumber = self::DEFAULT_MAX_NUMBER;

			return $this;
		}

		$this->maxNumber = $maxNumber;

		return $this;
	}

	/**
	 * @param string[] $ids
	 */
	public function order(array $ids): void {
		$this->validate();

		$count = count($ids);

		if (!$count) {
			return;
		}

		$this->entityManager
			->getTransactionManager()
			->start();

		$deleteQuery1 = $this->entityManager
			->getQueryBuilder()
			->delete()
			->from(UserKanbanOrder::ENTITY_TYPE)
			->where([
				'entityType' => $this->entityType,
				'userId' => $this->userId,
				'entityId' => $ids,
			])
			->build();

		$this->entityManager->getQueryExecutor()->execute($deleteQuery1);

		$minOrder = null;

		$first = $this->entityManager
			->getRDBRepository(UserKanbanOrder::ENTITY_TYPE)
			->select(['id', 'order'])
			->where([
				'entityType' => $this->entityType,
				'userId' => $this->userId,
				'group' => $this->group,
			])
			->order('order')
			->findOne();

		if ($first) {
			$minOrder = $first->get('order');
		}

		if ($minOrder !== null) {
			$offset = $count - $minOrder;

			$updateQuery = $this->entityManager
				->getQueryBuilder()
				->update()
				->in(UserKanbanOrder::ENTITY_TYPE)
				->where([
					'entityType' => $this->entityType,
					'group' => $this->group,
					'userId' => $this->userId,
				])
				->set([
					'order:' => 'ADD:(order, ' . strval($offset) . ')'
				])
				->build();

			$this->entityManager->getQueryExecutor()->execute($updateQuery);
		}

		$collection = $this->entityManager
			->getCollectionFactory()
			->create(UserKanbanOrder::ENTITY_TYPE);

		foreach ($ids as $i => $id) {
			$item = $this->entityManager->getNewEntity(UserKanbanOrder::ENTITY_TYPE);

			$item->set([
				'id' => $this->idGenerator->generate(),
				'entityId' => $id,
				'entityType' => $this->entityType,
				'group' => $this->group,
				'userId' => $this->userId,
				'order' => $i,
			]);

			$collection[] = $item;
		}

		$this->entityManager->getMapper()->massInsert($collection);

		$deleteQuery2 = $this->entityManager
			->getQueryBuilder()
			->delete()
			->from(UserKanbanOrder::ENTITY_TYPE)
			->where([
				'entityType' => $this->entityType,
				'group' => $this->group,
				'userId' => $this->userId,
				'order>' => $this->maxNumber,
			])
			->build();

		$this->entityManager->getQueryExecutor()->execute($deleteQuery2);

		$this->entityManager
			->getTransactionManager()
			->commit();
	}

	private function validate(): void {
		if (!$this->entityType) {
			throw new LogicException('No entity type.');
		}

		if (!$this->group) {
			throw new LogicException('No group.');
		}

		if (!$this->userId) {
			throw new LogicException('No user ID.');
		}

		if (!$this->metadata->get(['scopes', $this->entityType, 'object'])) {
			throw new LogicException('Not allowed entity type.');
		}

		$orderDisabled = $this->metadata->get(['scopes', $this->entityType, 'kanbanOrderDisabled']);

		if ($orderDisabled) {
			throw new LogicException('Order is disabled.');
		}
	}

}
