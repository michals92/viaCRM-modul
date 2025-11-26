<?php

namespace Espo\Modules\Viacrm\Classes\VariableCss\Sources;

use Espo\Core\Utils\Config;
use Espo\Modules\Viacrm\Classes\VariableCss\Source as VariableCssSource;

class StickyHeader implements VariableCssSource
{
	public function __construct(
		private readonly Config $config
	) {
	}

	public function get(): string
	{
		if ($this->config->get('stickyHeader')) {
			/** @lang CSS */
			return <<<'CSS'
				@media only screen and (min-width: 1200px) {
					.page-header {
						background: var(--body-bg) !important;
						margin: 0 !important;
						transition: all 0.2s ease-out;
						will-change: position, transform;
						-webkit-backface-visibility: hidden;
						backface-visibility: hidden;
						position: relative;
						z-index: 1000;
					}
				}
			CSS;
		}

		return '';
	}
}
