<?php

namespace Espo\Modules\Autocrm\Entities;

use Espo\Core\Field\Date;

class NextSequenceNumber extends \Espo\Core\Templates\Entities\Base {

	public const ENTITY_TYPE = 'NextSequenceNumber';

	public const RESET_YEARLY = 'Yearly';
	public const RESET_MONTHLY = 'Monthly';
	public const RESET_DAILY = 'Daily';
	public const RESET_NEVER = 'Never';

	public function getNumberValue(): int {
		return $this->get('value') ?? 1;
	}

	/**
	 * @return Date
	 */
	public function getDate(): Date {
		/** @var Date */
		return $this->getValueObject('date') ?? Date::createToday();
	}

	public function setNumberValue(int $value): void {
		$this->set('value', $value);
	}

	public function setDate(Date $date): void {
		$this->set('date', $date->toString());
	}

}
