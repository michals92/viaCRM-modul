<?php

namespace Espo\Modules\Viacrm\Tools\Finstat;

use DOMDocument;
use DOMXPath;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Error\Body as ErrorBody;
use Espo\Core\Exceptions\ErrorSilent;
use Espo\Core\ORM\EntityManager;
use stdClass;

readonly class Service {
	private const URL = 'https://www.finstat.sk/';

	public function __construct(
		private EntityManager $entityManager,
	) {}

	/**
	 * @throws Error
	 * @throws BadRequest
	 */
	public function getDataBySicCode(string $sicCode): stdClass {
		if (!preg_match('/^[0-9]{8}$/', $sicCode)) {
			throw BadRequest::createWithBody(
				'Invalid SIC code',
				ErrorBody::create()
					->withMessageTranslation(
						'invalidSicCode',
						'Account',
						[
							'sicCode' => $sicCode,
						]
					)
					->encode()
			);
		}

		$response = $this->curlRequest(self::URL . $sicCode);
		$responseStatus = $response['status'];
		$html = $response['body'];
		$dom = new DOMDocument();

		if ($responseStatus === 200) {
			$dom->loadHTML($html);
		} else if ($responseStatus === 404) {
			throw ErrorSilent::createWithBody(
				'Could not find the company',
				ErrorBody::create()
					->withMessageTranslation(
						'couldNotFindCompanyBySicCode',
						'Account',
						[
							'sicCode' => $sicCode,
						]
					)
					->encode()
			);
		} else {
			throw Error::createWithBody(
				'Error while fetching data from Finstat',
				ErrorBody::create()
					->withMessageTranslation(
						'errorWhileFetchingFinstat',
						'Account',
					)
					->encode()
			);
		}

		$conditions = [];
		if ($this->getVatId($dom)) {
			$conditions[] = ['vatId' => $this->getVatId($dom)];
		}
		if ($this->getSlovakVatId($dom)) {
			$conditions[] = ['slovakVatId' => $this->getSlovakVatId($dom)];
		}
		if ($sicCode) {
			$conditions[] = ['sicCode' => $sicCode];
		}
		$account = null;

		if (!empty($conditions)) {
			$account = $this->entityManager->getRDBRepository('Account')->where(['OR' => $conditions])->findOne();
		}

		return (object) [
			'vatId' => $this->getVatId($dom) ?: '',
			'slovakVatId' => $this->getSlovakVatId($dom) ?: '',
			'name' => $account ? $account->get('name') : $this->getName($dom),
			'id' => $account?->getId(),
			'billingAddressCity' => $this->getAddressCity($dom) ?: '',
			'billingAddressStreet' => $this->getAddressStreet($dom),
			'billingAddressState' => $this->getAddressRegion($dom) ?: '',
			'billingAddressPostalCode' => $this->getAddressPostalCode($dom) ?: '',
			'billingAddressCountry' => 'Slovensko',
		];
	}

	private function getVatId(DOMDocument $dom): ?string {
		$xpath = new DomXPath($dom);
		$elements = $xpath->query("//li[@class='inline']//strong[text()='DIČ']");

		if (!$elements || $elements->length === 0) {
			return null;
		}

		$elements = $elements[0]->parentNode->getElementsByTagName('span');

		if ($elements->length === 0) {
			return null;
		}

		return trim($elements[0]->nodeValue);
	}

	private function getSlovakVatId(DOMDocument $dom): ?string {
		$xpath = new DomXPath($dom);
		$elements = $xpath->query("//li[@class='inline']//strong[text()='IČ DPH']");

		if (!$elements || $elements->length === 0) {
			return null;
		}

		$elements = $elements[0]->parentNode->getElementsByTagName('span');

		if ($elements->length === 0) {
			return null;
		}

		$value = explode(',', $elements[0]->nodeValue)[0];

		return trim($value);
	}

	private function getName(DOMDocument $dom): string {
		$name = $dom->getElementsByTagName('h1')[0]->nodeValue;
		$position = strpos($name, '(Historický názov:');

		if ($position !== false) {
			$name = substr($name, 0, $position);
		}

		return trim($name);
	}

	private function getAddressCity(DOMDocument $dom): ?string {
		$xpath = new DomXPath($dom);
		$elements = $xpath->query('//strong[text()="Sídlo"]');

		if (!$elements || $elements->length === 0) {
			return null;
		}

		$tempAddress = $elements[0]->parentNode->nodeValue;
		$tempAddress = str_replace('Sídlo ', '', $tempAddress);
		$tempAddress = str_replace($this->getName($dom), '', $tempAddress);

		$tempAddressStr = is_array($tempAddress) ? implode('', $tempAddress) : $tempAddress;
		for ($i = strlen($tempAddressStr) - 1; $i >= 0; $i--) {
			if (in_array($tempAddressStr[$i], ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])) {
				return trim(substr($tempAddressStr, $i + 1));
			}
		}

		return null;
	}

	private function getAddressStreet(DOMDocument $dom): string {
		$xpath = new DomXPath($dom);
		$nodes = $xpath->query('//strong[text()="Sídlo"]');

		if (!$nodes || $nodes->length === 0) {
			return '';
		}

		$city = $this->getAddressCity($dom) ?? '';
		$postalCode = $this->getAddressPostalCode($dom) ?? '';
		$offset = strlen($city) + strlen($postalCode);

		$addressStreet = $nodes[0]->parentNode->nodeValue;
		$addressStreet = str_replace('Sídlo ', '', $addressStreet);
		$addressStreet = str_replace($this->getName($dom), '', $addressStreet);
		$addressStreetStr = is_array($addressStreet) ? implode('', $addressStreet) : $addressStreet;
		$addressStreetLength = strlen($addressStreetStr);

		if ($addressStreetLength > $offset + 2) {
			$addressStreetStr = substr($addressStreetStr, 0, $addressStreetLength - $offset - 2);
		}

		return trim($addressStreetStr);
	}

	private function getAddressPostalCode(DOMDocument $dom): ?string {
		$xpath = new DomXPath($dom);
		$nodes = $xpath->query('//strong[text()="Sídlo"]');

		if (!$nodes || $nodes->length === 0) {
			return null;
		}

		$tempAddress = $nodes[0]->parentNode->nodeValue;
		$tempAddress = str_replace('Sídlo ', '', $tempAddress);
		$tempAddress = str_replace($this->getName($dom), '', $tempAddress);
		$tempAddressStr = is_array($tempAddress) ? implode('', $tempAddress) : $tempAddress;

		$len = strlen($tempAddressStr);
		for ($i = $len - 1; $i >= 0; $i--) {
			if (in_array($tempAddressStr[$i], ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])) {
				if ($i >= 5) {
					return str_replace(' ', '', trim(substr($tempAddressStr, $i - 5, 6)));
				}

				return null;
			}
		}

		return null;
	}

	private function getAddressRegion(DOMDocument $dom): ?string {
		$xpath = new DomXPath($dom);
		$nodes = $xpath->query('//div[contains(@class, "detail-menu-related-item")]//a[starts-with(text(), "Databáza firiem v kraji:")]');

		if (!$nodes || $nodes->length === 0) {
			return null;
		}

		$values = explode(':', $nodes[0]->nodeValue);

		if (count($values) > 1) {
			return trim($values[1]);
		}

		return null;
	}

	/**
	 * @return array{status: int|string, body: string}
	 */
	private function curlRequest(string $url): array {
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_HEADER, false); // Changed to false as we don't need the header anymore

		/** @var string|false $body */
		$body = curl_exec($ch);

		if (curl_errno($ch)) {
			throw new Error('cURL Error: ' . curl_error($ch));
		}

		$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

		curl_close($ch);

		return [
			'status' => $status_code,
			'body' => $body === false ? '' : $body
		];
	}
}
