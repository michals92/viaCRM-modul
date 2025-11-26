<?php

namespace Espo\Modules\Viacrm\Entities;

class EmailFilter extends \Espo\Entities\EmailFilter
{
	public const string ENTITY_TYPE = 'EmailFilter';
	public const string TEMPLATE_TYPE = 'Base';

	public function skipNotification(): bool
	{
		return (bool) $this->get('skipNotification');
	}
}
