<?php

namespace Espo\Modules\Viacrm\Services;

use Cron\CronExpression;
use DateTimeImmutable;
use DateTimeZone;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Error\Body as ErrorBody;
use Espo\Core\Exceptions\ErrorSilent;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\ForbiddenSilent;
use Espo\Core\Field\Date;
use Espo\Core\Field\DateTime;
use Espo\Core\Field\DateTimeOptional;
use Espo\Core\Utils\DateTime as DateTimeUtil;
use Espo\Modules\Viacrm\Entities\RecordRecurrence as RecordRecurrenceEntity;
use Espo\ORM\BaseEntity;
use Espo\ORM\Entity;
use Exception;
use RuntimeException;

class RecordRecurrence extends \Espo\Core\Templates\Services\Base {

	/**
	 * @throws Error
	 * @throws Exception
	 */
	public function processRecurringRecords(RecordRecurrenceEntity $recordRecurrence): void {
		$now = new DateTimeImmutable();

		$timezoneStr = $this->config->get('timeZone') ?? 'UTC';
		$serverTimezone = new DateTimeZone($timezoneStr);
		$isBatched = $recordRecurrence->isBatched();
		$lastBatch = !$isBatched;
		$entityType = $recordRecurrence->get('entityType');
		$data = $recordRecurrence->get('data');
		$dateStartString = $data->dateStart ?? null;

		if (!$dateStartString) {
			throw new Error('Date start is not set.');
		}

		// Create $dateStart from UTC (EspoCRM stores date/time in UTC)
		// But we need to interpret it as server timezone for cron calculations
		$dateStartUTC = DateTimeImmutable::createFromFormat(
			DateTimeUtil::SYSTEM_DATE_TIME_FORMAT,
			$dateStartString,
			new DateTimeZone('UTC')
		) ?: throw new RuntimeException();

		// Convert to server timezone for cron calculations
		$dateStart = $dateStartUTC->setTimezone($serverTimezone);

		$until = $recordRecurrence->getUntilDateTime() ?? throw new RuntimeException();
		$infinite = $recordRecurrence->get('infinite');

		// Use dateStart as the reference point for 'lastGenerated' if it's not set
		$lastGenerated = $recordRecurrence->getLastGeneratedDateTime();

		if (!$lastGenerated) {
			$recordRecurrence->set('lastGenerated', $dateStart->format(DateTimeUtil::SYSTEM_DATE_TIME_FORMAT));
			$lastGenerated = $dateStart;
		}

		if ($isBatched) {
			// Calculate 'until' date from dateStart instead of now
			$untilNew = $dateStart->add($recordRecurrence->getGenerateInAdvanceInterval());

			if ($infinite || $untilNew < $until) {
				$until = $untilNew;
			} else {
				$lastBatch = true;
			}
		} elseif ($until < $now) {
			$recordRecurrence->set('status', 'Completed');

			return;
		}

		// Get the next creation date (often in local time)
		$nextDate = $recordRecurrence->getNextCreateDate(
			currentTime: $lastGenerated,
			allowCurrentDate: false,
			timeZone: $timezoneStr
		);

		// If no valid next date within this batch, mark completed.
		if ($lastBatch && $nextDate > $until) {
			$recordRecurrence->set('status', 'Completed');

			return;
		}

		// Fields that we want to shift in time by the same interval as dateStart->nextDate
		$fieldsToShift = ['dateEnd'];
		try {
			for ($i = 0; $nextDate <= $until; $i++) {
				// Diff to add to each field that needs time shifting
				$diff = $dateStart->diff($nextDate);

				/** @var BaseEntity $scheduledRecord */
				$scheduledRecord = $this->entityManager->getNewEntity($entityType);

				// Copy original record data
				$scheduledRecord->set($data);

				// Set the new dateStart (convert to UTC for storage)
				$scheduledRecord->set(
					'dateStart',
					$nextDate->setTimezone(new DateTimeZone('UTC'))->format(DateTimeUtil::SYSTEM_DATE_TIME_FORMAT)
				);
				// Reset `Date` portion of datetime as it can and will 'override' our `dateStart`
				$scheduledRecord->set('dateStartDate', null);

				// For each field that needs time shifting
				foreach ($fieldsToShift as $field) {
					if ($scheduledRecord->has($field)) {
						/** @var DateTime|null $orgValue */
						$orgValue = $scheduledRecord->getValueObject($field);

						// Skip null fields (like empty dateEnd)
						if ($orgValue === null) {
							continue;
						}

						// if implements one of: DateTime, Date, DateTimeOptional
						if (!$this->isValidDateField($orgValue)) {
							continue;
						}

						/* @var DateTime|DateTimeOptional|Date $orgValue */

						// Store the new date/time in the record
						$scheduledRecord->setValueObject($field, $orgValue->add($diff));
						$scheduledRecord->set($field . 'Date', null);
					}
				}

				// Save the newly generated entity
				$this->entityManager->saveEntity($scheduledRecord);

				// Prepare for the next iteration
				$nextDate = $recordRecurrence->getNextCreateDate(
					currentTime: $lastGenerated,
					nth: $i + 1,
					allowCurrentDate: false,
					timeZone: $timezoneStr
				);
			}
		} catch (Exception) {
			// If an error occurs in the loop, store the last generated date so we don't spam
			$recordRecurrence->set('lastGenerated', $nextDate->format(DateTimeUtil::SYSTEM_DATE_TIME_FORMAT));

			return;
		}

		if ($lastBatch) {
			$recordRecurrence->set('status', 'Completed');

			return;
		}

		// Update 'lastGenerated' up to 'until'
		$newLastGenerated = $until->format(DateTimeUtil::SYSTEM_DATE_TIME_FORMAT);
		$recordRecurrence->set('lastGenerated', $newLastGenerated);
	}

	/**
	 * @throws Exception
	 */
	public function isAboveBatchSizeLimit(RecordRecurrenceEntity $recordRecurrence): bool {
		$timezoneStr = $this->config->get('timeZone') ?? 'UTC';
		$runLimit = $this->config->get('recurrenceBatchSizeLimit');

		if ($runLimit == null || $runLimit < 0) {
			$runLimit = 500;
		}

		$now = new \DateTimeImmutable();
		$isBatched = $recordRecurrence->isBatched();
		$until = $isBatched
			? $now->add($recordRecurrence->getGenerateInAdvanceInterval())
			: $recordRecurrence->getUntilDateTime();

		$numberOfRecurrences = 0;

		do {
			$nextDate = $recordRecurrence->getNextCreateDate(
				nth: $numberOfRecurrences,
				allowCurrentDate: true,
				timeZone: $timezoneStr,
			);
			$numberOfRecurrences++;

			if ($numberOfRecurrences > $runLimit) {
				return true;
			}
		} while ($nextDate < $until);

		return false;
	}

	/**
	 * @throws Forbidden
	 * @throws Exception
	 */
	protected function beforeCreateEntity(Entity $entity, $data): void {
		assert($entity instanceof RecordRecurrenceEntity);

		if (!CronExpression::isValidExpression($entity->get('scheduling'))) {
			throw ErrorSilent::createWithBody(
				'Invalid scheduling expression.',
				ErrorBody::create()
					->withMessageTranslation(
						'invalidSchedulingExpression',
						'RecordRecurrence',
					)
					->encode()
			);
		}

		if ($this->isAboveBatchSizeLimit($entity)) {
			throw ForbiddenSilent::createWithBody(
				'Batch size limit exceeded.',
				ErrorBody::create()
					->withMessageTranslation(
						'batchSizeLimitExceeded',
						'RecordRecurrence',
					)
					->encode()
			);
		}

		parent::beforeCreateEntity($entity, $data);
	}

	private function isValidDateField(object|null $orgValue): bool {
		return $orgValue instanceof DateTime || $orgValue instanceof DateTimeOptional || $orgValue instanceof Date;
	}

}
