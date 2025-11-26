<?php

namespace Espo\Modules\Viacrm\Entities;

class TaxClass extends \Espo\Core\Templates\Entities\Base {
	public const string ENTITY_TYPE = 'TaxClass';
	public const string TEMPLATE_TYPE = 'Base';

	public function getRate(): float {
		return (float) $this->get('rate');
	}
}
