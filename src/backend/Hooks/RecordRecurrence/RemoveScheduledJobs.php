<?php

namespace Espo\Modules\Viacrm\Hooks\RecordRecurrence;

use Espo\Core\Hook\Hook\AfterRemove;
use Espo\Core\Hook\Hook\AfterSave;
use Espo\Core\Job\Job\Status;
use Espo\Entities\Job as JobEntity;
use Espo\Entities\ScheduledJob as ScheduledJobEntity;
use Espo\Modules\Viacrm\Entities\RecordRecurrence;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Repository\Option\RemoveOptions;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements AfterSave<RecordRecurrence>
 * @implements AfterRemove<RecordRecurrence>
 */
readonly class RemoveScheduledJobs implements AfterSave, AfterRemove {

	public function __construct(
		private EntityManager $entityManager,
	) {}

	public function afterSave(Entity $entity, SaveOptions $options): void {
		if (!$entity->isNew()) {
			$this->removeEntityScheduledJob($entity);
		}
	}

	public function afterRemove(Entity $entity, RemoveOptions $options): void {
		$this->removeEntityScheduledJob($entity);
	}

	private function removeEntityScheduledJob(Entity $entity): void {
		$scheduledJob = $this->getScheduledJobEntity();

		if (!$scheduledJob) {
			return;
		}

		$this
			->entityManager
			->getRDBRepository(JobEntity::ENTITY_TYPE)
			->where([
				'scheduledJobId' => $scheduledJob->getId(),
				'status' => [
					Status::PENDING,
					Status::RUNNING,
				],
				'targetType' => $entity->getEntityType(),
				'targetId' => $entity->getId(),
			]);
	}

	private function getScheduledJobEntity(): ?ScheduledJobEntity {
		return $this
			->entityManager
			->getRDBRepository(ScheduledJobEntity::ENTITY_TYPE)
			->where('name', 'CheckRecurringRecords')
			->findOne();
	}

}