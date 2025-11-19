<?php

namespace Espo\Modules\Autocrm\Classes\TemplateHelpers;

use Espo\Core\Htmlizer\Helper;
use Espo\Core\Htmlizer\Helper\Data;
use Espo\Core\Htmlizer\Helper\Result;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Language;

class TranslateOption implements Helper {

	public function __construct(
		private readonly InjectableFactory $injectableFactory,
	) {}

	public function render(Data $data): Result {
		$params = $data->getArgumentList();

		if (count($params) !== 3 && count($params) !== 4) {
			throw new \RuntimeException('The translateOption requires exactly three or four arguments.');
		}

		if (count($params) === 4) {
			[$value, $field, $scope, $langCode] = $params;

			$language = $this->injectableFactory->createWith(Language::class, ['language' => $langCode]);

			$translation = $language->translateOption($value, $field, $scope);
		} else {
			[$value, $field, $scope] = $params;

			$language = $this->injectableFactory->create(Language::class);

			$translation = $language->translateOption($value, $field, $scope);
		}

		return Result::createSafeString($translation);
	}

}
