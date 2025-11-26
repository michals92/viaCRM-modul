<?php

namespace Espo\Modules\Viacrm\Classes\Jobs;

use Espo\Core\Exceptions\Error;
use Espo\Core\Job\Job;
use Espo\Core\Job\Job\Data as JobData;
use Espo\Modules\Viacrm\Entities\RecordRecurrence;
use Espo\Modules\Viacrm\Services\RecordRecurrence as Service;
use Espo\ORM\EntityManager;

readonly class CheckRecurringRecords implements Job
{
	public function __construct(
		private Service $service,
		private EntityManager $entityManager,
	) {
	}

	/**
	 * @throws Error
	 */
	public function run(JobData $data): void
	{
		$recordRecurrenceId = $data->getTargetId();

		if (!$recordRecurrenceId) {
			throw new Error('No target.');
		}

		/** @var ?RecordRecurrence $recordRecurrence */
		$recordRecurrence = $this->entityManager->getEntityById(RecordRecurrence::ENTITY_TYPE, $recordRecurrenceId);

		if (!$recordRecurrence) {
			throw new Error('Record Recurrence not found.');
		}

		if ($recordRecurrence->getUntilDateTime()) {
			$this->service->processRecurringRecords($recordRecurrence);

			$this->entityManager->saveEntity($recordRecurrence);
		}
	}
}
