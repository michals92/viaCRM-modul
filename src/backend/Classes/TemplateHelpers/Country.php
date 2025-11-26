<?php

namespace Espo\Modules\Viacrm\Classes\TemplateHelpers;

use Espo\Core\Htmlizer\Helper;
use Espo\Core\Htmlizer\Helper\Data;
use Espo\Core\Htmlizer\Helper\Result;
use Espo\Core\Utils\Language;
use Espo\Entities\Settings;

class Country implements Helper {
	public function __construct(
		private readonly Language $language
	) {}

	public function render(Data $data): Result {
		$country = $data->getArgumentList()[0];

		$translated = $this->language->translateOption($country, 'addressCountryList', Settings::ENTITY_TYPE);

		return Result::createSafeString($translated);
	}
}
