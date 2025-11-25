<?php

namespace Espo\Modules\Viacrm\Core\Loaders;

use Espo\Core\Container\Loader;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Metadata as MetadataService;
use Espo\Entities\Preferences;
use Espo\Modules\Viacrm\Core\Utils\Language as LanguageService;

class Language implements Loader {

	public function __construct(
		private readonly InjectableFactory $injectableFactory,
		private readonly Config            $config,
		private readonly Preferences       $preferences
	) {}

	public function load(): LanguageService {
		$metadata = $this->injectableFactory->createWith(MetadataService::class, [
			'useCache' => $this->config->get('useCache') ?? false,
		]);

		return $this->injectableFactory->createWith(LanguageService::class, [
			'language' => LanguageService::detectLanguage($this->config, $this->preferences),
			'useCache' => $this->config->get('useCache') ?? false,
			'metadata' => $metadata,
		]);
	}

}