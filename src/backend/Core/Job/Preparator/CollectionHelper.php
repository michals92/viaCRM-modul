<?php

namespace Espo\Modules\Viacrm\Core\Job\Preparator;

use DateTimeImmutable;
use Espo\Core\Job\Job\Status;
use Espo\Core\Job\Preparator\Data;
use Espo\Core\Utils\DateTime;
use Espo\Entities\Job;
use Espo\ORM\Collection;
use Espo\ORM\Entity;
use Espo\ORM\EntityCollection;
use Espo\ORM\EntityManager;

/**
 * Creates jobs for each entity of a collection.
 * To be used by Preparator implementations.
 *
 * @template TEntity of Entity
 */
class CollectionHelper
{
	public const NAME = 'job';
	public const CLASS_NAME = 'className';
	public const SERVICE_NAME = 'serviceName';
	public const ALLOWED_TYPES = [
		self::NAME,
		self::CLASS_NAME,
		self::SERVICE_NAME,
	];

	public int $maxConcurrentRunningWithSameTarget = 1;

	public int $maxPendingWithSameTarget = 2;

	public function __construct(
		protected readonly EntityManager $entityManager
	) {
	}

	/**
	 * @return self<TEntity>
	 */
	public function withMaxConcurrentRunningWithSameTarget(int $maxConcurrentRunningWithSameTarget): self
	{
		$this->maxConcurrentRunningWithSameTarget = $maxConcurrentRunningWithSameTarget;

		return $this;
	}

	/**
	 * @return self<TEntity>
	 */
	public function withMaxPendingWithSameTarget(int $maxPendingWithSameTarget): self
	{
		$this->maxPendingWithSameTarget = $maxPendingWithSameTarget;

		return $this;
	}

	/**
	 * @param Collection<TEntity>       $collection
	 * @param Data|array<string, mixed> $data
	 * @param DateTimeImmutable         $executeTime
	 *
	 * @return EntityCollection<Job>
	 */
	public function prepare(Collection $collection, Data|array $data, DateTimeImmutable $executeTime = new \DateTimeImmutable()): EntityCollection
	{
		/** @var EntityCollection<Job> $jobsCollection */
		$jobsCollection = $this->entityManager
			->getCollectionFactory()
			->create(Job::ENTITY_TYPE);

		foreach ($collection as $entity) {
			$job = $this->prepareItem($entity, $data, $executeTime);
			$job && $jobsCollection->append($job);
		}

		return $jobsCollection;
	}

	/**
	 * @param TEntity&Entity            $entity
	 * @param Data|array<string, mixed> $data
	 * @param DateTimeImmutable         $executeTime
	 *
	 * @return Job|null
	 */
	private function prepareItem(Entity $entity, Data|array $data, DateTimeImmutable $executeTime): ?Job
	{
		$whereClause = [
			'status' => [
				Status::RUNNING,
				Status::READY,
			],
			'targetType' => $entity->getEntityType(),
			'targetId' => $entity->getId(),
		];

		$this->prepareWhereClause($whereClause, $data);

		$countRunning = $this->entityManager
			->getRDBRepository(Job::ENTITY_TYPE)
			->select('id')
			->where($whereClause)
			->count();

		if ($countRunning >= $this->maxConcurrentRunningWithSameTarget) {
			return null;
		}

		$whereClause = [
			'status' => Status::PENDING,
			'targetType' => $entity->getEntityType(),
			'targetId' => $entity->getId(),
		];

		$this->prepareWhereClause($whereClause, $data);

		$countPending = $this->entityManager
			->getRDBRepository(Job::ENTITY_TYPE)
			->where($whereClause)
			->count();

		if ($countPending >= $this->maxPendingWithSameTarget) {
			return null;
		}

		$jobEntityData = [
			'status' => Status::PENDING,
			'executeTime' => $executeTime->format(DateTime::SYSTEM_DATE_TIME_FORMAT),
			'targetType' => $entity->getEntityType(),
			'targetId' => $entity->getId(),
		];

		$this->prepareJobData($jobEntityData, $data);

		/** @var Job $jobEntity */
		$jobEntity = $this->entityManager->createEntity(Job::ENTITY_TYPE, $jobEntityData);

		return $jobEntity;
	}

	/**
	 * @param array<string, mixed>      $whereClause
	 * @param Data|array<string, mixed> $data
	 */
	protected function prepareWhereClause(array &$whereClause, Data|array $data): void
	{
		if (is_array($data)) {
			foreach ($data as $key => $value) {
				if (!in_array($key, self::ALLOWED_TYPES, true)) {
					continue;
				}

				if ($key === self::NAME && count($data) > 1) {
					continue;
				}

				$data[$key] = $value;
			}
		} elseif ($data instanceof Data) {
			$whereClause['scheduledJobId'] = $data->getId();
			$whereClause['name'] = $data->getName();
		}
	}

	/**
	 * @param array<string, mixed>      $jobData
	 * @param Data|array<string, mixed> $data
	 */
	protected function prepareJobData(array &$jobData, Data|array $data): void
	{
		if (is_array($data)) {
			foreach ($data as $key => $value) {
				if (!in_array($key, self::ALLOWED_TYPES, true)) {
					continue;
				}

				$jobData[$key] = $value;
			}

			if (!isset($data[self::NAME])) {
				throw new \InvalidArgumentException('Job name is required.');
			}

			$jobData['name'] = $data[self::NAME];
		} elseif ($data instanceof Data) {
			$jobData['name'] = $data->getName();
			$jobData['scheduledJobId'] = $data->getId();
		}
	}
}
