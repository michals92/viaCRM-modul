<?php

namespace Espo\Modules\Autocrm\Entities;

class EmailFilter extends \Espo\Entities\EmailFilter {

	public function skipNotification(): bool {
		return (bool) $this->get('skipNotification');
	}

}
