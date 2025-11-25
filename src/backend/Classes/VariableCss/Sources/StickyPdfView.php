<?php

namespace Espo\Modules\Viacrm\Classes\VariableCss\Sources;

use Espo\Core\Utils\Config;
use Espo\Modules\Viacrm\Classes\VariableCss\Source as VariableCssSource;

class StickyPdfView implements VariableCssSource {

	public function __construct(
		private readonly Config $config
	) {}

	public function get(): string {
		if ($this->config->get('stickyPdfView')) {
			/** @lang CSS */
			return <<<'CSS'
				@media only screen and (min-width: 1200px) {
					.record-grid.record-grid-compare .attachments > .panel.panel-default {
						position: sticky !important;
						top: 80px !important;
						z-index: 100 !important;
						height: calc(100vh - 80px) !important;
						overflow: hidden !important;
						max-height: 100vh !important;
						margin-bottom: 0 !important;
					}
				}
			CSS;
		}

		return '';
	}

} 