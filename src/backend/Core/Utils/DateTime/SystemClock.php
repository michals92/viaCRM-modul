<?php

namespace Espo\Modules\Autocrm\Core\Utils\DateTime;

use DateTimeImmutable;
use Espo\Core\Field\DateTime;

class SystemClock {

	public function now(): DateTimeImmutable {
		return DateTime::createNow()->toDateTime();
	}

}
