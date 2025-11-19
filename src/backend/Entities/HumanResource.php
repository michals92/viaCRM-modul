<?php

namespace Espo\Modules\Autocrm\Entities;

class HumanResource extends \Espo\Core\Templates\Entities\Base {

	public const ENTITY_TYPE = 'HumanResource';
    
	public function getManHour(): float {
		return $this->get('manHour') ?? 0;
	}

}
