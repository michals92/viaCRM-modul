<?php

namespace Espo\Modules\Viacrm\Classes\JobPreparators;

use DateTimeImmutable;
use Espo\Core\Job\Job\Status;
use Espo\Core\Job\Preparator;
use Espo\Core\Job\Preparator\Data as PreparatorData;
use Espo\Core\Utils\DateTime;
use Espo\Entities\Job as JobEntity;
use Espo\Modules\Viacrm\Entities\RecordRecurrence;
use Espo\ORM\EntityManager;
use Exception;
use RuntimeException;

readonly class CheckRecurringRecords implements Preparator {

	public function __construct(
		private EntityManager $entityManager,
	) {}

	/**
	 * @throws Exception
	 */
	public function prepare(PreparatorData $data, DateTimeImmutable $executeTime): void { // $executeTime will contain approximate current time
		$jobRepository = $this->entityManager->getRDBRepository(JobEntity::ENTITY_TYPE);
		$collection = $this->entityManager->getRDBRepository(RecordRecurrence::ENTITY_TYPE)
			->where([
				'status' => 'Active',
			])
			->find();

		/** @var RecordRecurrence $recordRecurrence */
		foreach ($collection as $recordRecurrence) {
			$running = $jobRepository->where([
				'scheduledJobId' => $data->getId(),
				'status' => [
					Status::RUNNING,
					Status::READY,
				],
				'targetType' => RecordRecurrence::ENTITY_TYPE,
				'targetId' => $recordRecurrence->getId(),
			])->findOne();

			if ($running) {
				continue;
			}

			$countPending = $jobRepository->where([
				'scheduledJobId' => $data->getId(),
				'status' => Status::PENDING,
				'targetType' => RecordRecurrence::ENTITY_TYPE,
				'targetId' => $recordRecurrence->getId(),
			])->count();

			if ($countPending > 0) {
				continue;
			}

			if ($recordRecurrence->isBatched()) {
				// max(first next recurrence - period, now) = next run time
				$generateInAdvanceInterval = $recordRecurrence->getGenerateInAdvanceInterval();
				$nextRunDate = $recordRecurrence->getNextCreateDate(
					currentTime: $recordRecurrence->getLastGeneratedDateTime() ?? throw new RuntimeException(),
					nth: $countPending,
				);

				$executeTime = max($executeTime, $nextRunDate->sub($generateInAdvanceInterval));
			}

			$this->entityManager->createEntity(JobEntity::ENTITY_TYPE, [
				'name' => $data->getName(),
				'scheduledJobId' => $data->getId(),
				'executeTime' => $executeTime->format(DateTime::SYSTEM_DATE_TIME_FORMAT),
				'targetType' => RecordRecurrence::ENTITY_TYPE,
				'targetId' => $recordRecurrence->getId(),
			]);
		}
	}

}
