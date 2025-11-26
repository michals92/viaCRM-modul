<?php

namespace Espo\Modules\Viacrm\Core\Utils\DateTime;

use DateTimeImmutable;
use Espo\Core\Field\DateTime;

class SystemClock
{
	public function now(): DateTimeImmutable
	{
		return DateTime::createNow()->toDateTime();
	}
}
