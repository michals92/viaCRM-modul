<?php

namespace Espo\Modules\Autocrm\Tools\DynamicLogic\ConditionChecker;

use DateTimeZone;

readonly class Options {

	public function __construct(
		public DateTimeZone $timezone = new DateTimeZone('UTC'),
	) {}

}
