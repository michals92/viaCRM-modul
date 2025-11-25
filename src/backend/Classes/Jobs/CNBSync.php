<?php

namespace Espo\Modules\Viacrm\Classes\Jobs;

use Espo\Core\Job\JobDataLess;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Config\ConfigWriter;

class CNBSync implements JobDataLess {

	protected const URL = 'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt';
	protected const ARCHIVE_URL = 'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-ostatnich-men/kurzy-ostatnich-men/rok.txt?rok=2024&format=txt';

	/** @var array<string, float> */
	protected array $currentRates;

	public function __construct(
		protected readonly EntityManager $entityManager,
		protected readonly ConfigWriter $configWriter,
		protected readonly Config $config
	) {
		$this->currentRates = $config->get('currencyRates', []);
	}

	public function run(): void {
		// Process the first URL (original data)
		$response = file_get_contents(self::URL);
		if ($response === false) {
			throw new \RuntimeException('Failed to fetch CNB data from: ' . self::URL);
		}
		$parsedResponse = explode("\n", $response);

		$exchangeRates = array_slice(
			$parsedResponse,
			2
		); // Remove date and header row

		if (end($exchangeRates) === '') { // last row can be empty string
			array_pop($exchangeRates);
		}

		$exchangeRates = array_map(function ($row) {
			$row = str_replace(',', '.', $row); // for correct float conversion

			return explode('|', $row);
		}, $exchangeRates);

		$exchangeMap = [];
		foreach ($exchangeRates as [,, $amount, $code, $rate]) {
			$exchangeMap[$code] = round((float)$rate / floatval($amount), 10);
		}

		// Process the second URL (additional currencies)
		$response2 = file_get_contents(self::ARCHIVE_URL);
		if ($response2 === false) {
			throw new \RuntimeException('Failed to fetch archive CNB data from: ' . self::ARCHIVE_URL);
		}
		$lines = explode("\n", $response2);

		// Remove empty lines from the end
		while (end($lines) === '') {
			array_pop($lines);
		}

		// Remove BOM if present
		if (substr($lines[0], 0, 3) === "\xEF\xBB\xBF") {
			$lines[0] = substr($lines[0], 3);
		}

		// Get the header line
		$headerLine = array_shift($lines);
		// Remove any empty lines that might have been before the header
		while ($headerLine === '') {
			$headerLine = array_shift($lines);
		}

		// Skip any lines until we find the last data line (latest date)
		$lastDataLine = '';
		for ($i = count($lines) - 1; $i >= 0; $i--) {
			$line = $lines[$i];
			if (trim($line) !== '') {
				$lastDataLine = $line;
				break;
			}
		}

		if ($lastDataLine === '') {
			throw new \Exception('No data found in archive data.');
		}

		assert(!is_null($headerLine));

		// Split header and data lines by '|'
		$headerColumns = explode('|', $headerLine);
		$dataColumns = explode('|', $lastDataLine);

		// Check that the number of columns match
		if (count($headerColumns) !== count($dataColumns)) {
			throw new \Exception('Header and data column count does not match in archive data.');
		}

		// Process each column (skip index 0, which is 'Datum')
		for ($i = 1; $i < count($headerColumns); $i++) {
			$headerItem = $headerColumns[$i];
			$dataItem = $dataColumns[$i];

			// Skip if data item is empty
			if ($dataItem === '') {
				continue;
			}

			// Parse header item to get amount and currency code
			$parts = explode(' ', $headerItem, 2);
			if (count($parts) !== 2) {
				continue; // unexpected format, skip
			}

			$amountString = str_replace(',', '.', $parts[0]);
			$currencyCode = $parts[1];

			$amount = (float)$amountString;

			// Replace comma with dot in data item for correct float conversion
			$rateString = str_replace(',', '.', $dataItem);
			$rate = (float)$rateString;

			// Calculate rate per unit
			$ratePerUnit = $rate / $amount;

			// Add to exchangeMap only if currency code not already present
			if (!array_key_exists($currencyCode, $exchangeMap)) {
				$exchangeMap[$currencyCode] = round($ratePerUnit, 10);
			}
		}

		$configCurrencyList = $this->config->get('currencyList', []);

		/* Write to config */
		foreach ($exchangeMap as $code => $rate) {
			if (in_array($code, $configCurrencyList)) {
				$this->currentRates[$code] = $rate;
			}
		}

		$this->configWriter->set('currencyRates', $this->currentRates);
		$this->configWriter->save();

		$currencyRepository = $this
		    ->entityManager
		    ->getRDBRepository('Currency');

		$currencies = $currencyRepository->select()
		    ->where(['id!=' => 'CZK'])
		    ->find();

		foreach ($currencies as $currency) {
			$currencyCode = $currency->getId();

			if (array_key_exists($currencyCode, $exchangeMap)) {
				$currency->set('rate', $exchangeMap[$currencyCode]);
				$currencyRepository->save($currency);
			}
		}
	}

}
