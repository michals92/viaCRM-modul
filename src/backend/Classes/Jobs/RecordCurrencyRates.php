<?php

namespace Espo\Modules\Autocrm\Classes\Jobs;

use Espo\Core\Job\JobDataLess;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Log;

class RecordCurrencyRates implements JobDataLess {

	public function __construct(
		private readonly Config $config,
		private readonly EntityManager $entityManager,
		private readonly Log $log
	) {}

	public function run(): void {
		$defaultCurrency = $this->config->get('defaultCurrency');

		if (!$defaultCurrency) {
			$this->log->error('[RecordCurrencyRates]: Default currency is not set');

			return;
		}

		$currencies = $this->config->get('currencyList') ?? [];
		$rates = $this->config->get('currencyRates') ?? [];
        
		foreach ($currencies as $currency) {
			if (!isset($rates[$currency])) {
				continue;
			}

			$this->entityManager->createEntity('CurrencyRateHistoryRecord', [
			    'name' => $currency,
			    'rate' => number_format($rates[$currency], 3, '.', ''),
			    'rateCurrency' => $defaultCurrency,
			]);
		}
	}

}
