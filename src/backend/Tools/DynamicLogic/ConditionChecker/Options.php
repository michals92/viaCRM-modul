<?php

namespace Espo\Modules\Viacrm\Tools\DynamicLogic\ConditionChecker;

use DateTimeZone;

readonly class Options
{
	public function __construct(
		public DateTimeZone $timezone = new DateTimeZone('UTC'),
	) {
	}
}
