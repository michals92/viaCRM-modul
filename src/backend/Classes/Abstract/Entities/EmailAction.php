<?php

namespace Espo\Modules\Viacrm\Classes\Abstract\Entities;

use Espo\Entities\EmailFilter;
use Espo\Modules\Viacrm\Entities\Email;

interface EmailAction {
	public function process(Email $email, EmailFilter $filter, ?string $userId = null): void;
}
