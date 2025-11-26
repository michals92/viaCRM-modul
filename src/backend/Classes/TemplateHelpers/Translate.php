<?php

namespace Espo\Modules\Viacrm\Classes\TemplateHelpers;

use Espo\Core\Htmlizer\Helper;
use Espo\Core\Htmlizer\Helper\Data;
use Espo\Core\Htmlizer\Helper\Result;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Language;

class Translate implements Helper
{
	public function __construct(
		private readonly InjectableFactory $injectableFactory,
		private readonly Config $config
	) {
	}

	public function render(Data $data): Result
	{
		$params = $data->getArgumentList();

		if (count($params) !== 3 && count($params) !== 4) {
			throw new \RuntimeException('The translate helper requires exactly three or four arguments.');
		}

		[$field, $category, $entityType, $langCode] = array_pad($params, 4, null);

		if ($langCode === null) {
			$langCode = $this->config->get('language', 'cs_CZ');
		}

		$language = $this->injectableFactory->createWith(Language::class, ['language' => $langCode]);

		$translation = $language->translateLabel($field, $category, $entityType);

		/** @var string $translation */
		return Result::createSafeString($translation);
	}
}
