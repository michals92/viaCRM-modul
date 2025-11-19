<?php

namespace Espo\Modules\Autocrm\Classes\VariableCss;

use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Log;
use Espo\Core\Utils\Metadata;

class Provider {

	public function __construct(
		private readonly InjectableFactory $injectableFactory,
		private readonly Metadata $metadata,
		private readonly Log $log,
	) {}

	public function getCss(): string {
		/** class-string<Source> */
		$sources = $this->metadata->get(['app', 'client', 'variableCssSources'], []);

		$css = '';

		foreach ($sources as $source) {
			if (!class_exists($source)) {
				continue;
			}

			try {
				$sourceInstance = $this->injectableFactory->create($source);
			} catch (\Exception $e) {
				$this->log->error('Error creating instance of VariableCss source: ' . $source);
				continue;
			}

			if (!$sourceInstance instanceof Source) {
				$this->log->error('VariableCss source must implement Source interface: ' . $source);
				continue;
			}

			try {
				$css .= $sourceInstance->get();
			} catch (\Exception $e) {
				$this->log->error('Error getting css from VariableCss source: ' . $source);
			}
		}

		return $css;
	}

}