<?php

namespace Espo\Modules\Autocrm\Entities;

use Cron\CronExpression;
use DateInterval;
use DateTimeImmutable;
use Espo\Core\Field\DateTime;
use Exception;
use RuntimeException;

class RecordRecurrence extends \Espo\Core\Templates\Entities\Base {

	public const ENTITY_TYPE = 'RecordRecurrence';

	private ?CronExpression $cronExpression = null;

	public function isBatched(): bool {
		return $this->get('generateInBatches') || $this->get('infinite');
	}

	public function getGenerateInAdvanceInterval(): DateInterval {
		return DateInterval::createFromDateString(str_replace('_', ' ', $this->get('generateInAdvance'))) ?: throw new RuntimeException('Date generation failed');
	}

	/**
	 * @throws Exception
	 */
	public function getNextCreateDate(
		string|\DateTimeInterface $currentTime = 'now',
		int $nth = 0,
		bool $allowCurrentDate = false,
		?string $timeZone = null
	): DateTimeImmutable {
		if (!$currentTime) {
			$currentTime = 'now';
		}

		$lastGenerated = $this->getLastGeneratedDateTime();

		do {
			$nextDate = $this->getCronExpression()
			    ->setMaxIterationCount(PHP_INT_MAX)
			    ->getNextRunDate($currentTime, $nth++, $allowCurrentDate, $timeZone);
			// Keep the timezone as provided, don't force UTC
		} while ($lastGenerated && $nextDate < $lastGenerated);

		return DateTimeImmutable::createFromMutable($nextDate);
	}

	public function getLastGeneratedDateTime(): ?DateTimeImmutable {
		/** @var ?DateTime $lastGenerated */
		$lastGenerated = $this->getValueObject('lastGenerated');

		return $lastGenerated?->toDateTime();
	}

	public function getCronExpression(): CronExpression {
		return $this->cronExpression ??= new CronExpression($this->get('scheduling'));
	}

	public function getUntilDateTime(): ?DateTimeImmutable {
		/** @var ?DateTime $until */
		$until = $this->getValueObject('until');

		return $until?->toDateTime();
	}

}