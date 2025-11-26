<?php

namespace Espo\Modules\Viacrm\Entities;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Field\Date;
use Espo\Modules\Viacrm\Tools\Error\ErrorFactory;

class Holiday extends \Espo\Core\Templates\Entities\Base {
	public const string TEMPLATE_TYPE = 'Base';

	public const string ENTITY_TYPE = 'Holiday';

	/**
	 * @throws BadRequest
	 */
	public function getDate(): Date {
		if ($date = $this->get('date')) {
			return new Date($date);
		}

		ErrorFactory::throwBadRequest('Date is not present', 'Date is not present');
	}

	/**
	 * @throws BadRequest
	 */
	public function getName(): string {
		return $this->get('name') ?? ErrorFactory::throwBadRequest('Name is not present', 'Name is not present');
	}

	/**
	 * @throws BadRequest
	 */
	public function getLangCode(): string {
		return $this->get('langCode') ?? ErrorFactory::throwBadRequest('LangCode is not present', 'LangCode is not present');
	}
}
