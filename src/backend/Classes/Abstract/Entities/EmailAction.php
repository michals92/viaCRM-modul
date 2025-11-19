<?php

namespace Espo\Modules\Autocrm\Classes\Abstract\Entities;

use Espo\Entities\EmailFilter;
use Espo\Modules\Autocrm\Entities\Email;

interface EmailAction {

	public function process(Email $email, EmailFilter $filter, ?string $userId = null): void;

}
