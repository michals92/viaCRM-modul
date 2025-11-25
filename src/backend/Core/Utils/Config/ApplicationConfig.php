<?php

namespace Espo\Modules\Viacrm\Core\Utils\Config;

use Espo\Core\Utils\Config;

/**
 * @since 9.0.0
 */
class ApplicationConfig {

	public function __construct(
		private readonly Config $config,
	) {}

	public function getSiteUrl(): string {
		return rtrim($this->config->get('siteUrl') ?? '', '/');
	}

	public function getDateFormat(): string {
		return $this->config->get('dateFormat') ?? 'DD.MM.YYYY';
	}

	public function getTimeFormat(): string {
		return $this->config->get('timeFormat') ?? 'HH:mm';
	}

	public function getTimeZone(): string {
		return $this->config->get('timeZone') ?? 'UTC';
	}

	public function getLanguage(): string {
		return $this->config->get('language') ?? 'en_US';
	}

}
