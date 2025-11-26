<?php

namespace Espo\Modules\Viacrm\Tools\Ares;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Error\Body as ErrorBody;
use Espo\Core\Exceptions\ErrorSilent;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Json;
use stdClass;

class Service {
	private const URL_BY_SIC = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/';
	private const URL_BY_NAME = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat';

	public function __construct(
		private readonly Config $config,
		private readonly EntityManager $entityManager,
	) {}

	/**
	 * Get company data by the sic code (IČO) from the ARES API
	 *
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

		$response = $this->curlRequest(self::URL_BY_SIC . $sicCode);

		try {
			/** @var stdClass $data */
			$data = Json::decode($response);
		} catch (\JsonException) {
			/** @var stdClass|null $data */
			$data = null;
		}

		if ($data === null || !isset($data->ico)) {
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
		}

		$includeHouseNumbers = $this->config->get('aresIncludeHouseNumbersInAddress', true);

		$conditions = [];
		if ($data->dic) {
			$conditions[] = ['vatId' => $data->dic];
		}
		if ($data->ico) {
			$conditions[] = ['ico' => $data->ico];
		}
		$account = null;

		if (!empty($conditions)) {
			$account = $this->entityManager->getRDBRepository('Account')->where(['OR' => $conditions])->findOne();
		}

		return (object)[
			'vatId' => $data->dic ?? null,
			'name' => $data->obchodniJmeno ?? $account?->get('name'),
			'id' => $account?->getId(),
			'billingAddressCity' => $data->sidlo?->nazevObce ?? null,
			'billingAddressStreet' => $this->getStreet($data->sidlo ?? new stdClass, $includeHouseNumbers),
			'billingAddressState' => $data->sidlo?->nazevKraje ?? null,
			'billingAddressPostalCode' => (string)$data->sidlo?->psc,
			'billingAddressCountry' => $data->sidlo?->kodStatu ?? null,
		];
	}

	/**
	 * Get raw company data by the sic code (IČO) from the ARES API without any processing
	 *
	 * @throws Error
	 * @throws BadRequest
	 */
	public function getRawDataBySicCode(string $sicCode): stdClass {
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

		$response = $this->curlRequest(self::URL_BY_SIC . $sicCode);

		try {
			/** @var stdClass $data */
			$data = Json::decode($response);
		} catch (\JsonException) {
			/** @var stdClass|null $data */
			$data = null;
		}

		if ($data === null || !isset($data->ico)) {
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
		}

		return $data;
	}

	/**
	 * Get company data by company name from the ARES API
	 *
	 * @param  string     $name Company name to search for
	 * @throws Error
	 * @throws BadRequest
	 *
	 * The returned object has the following structure:
	 * {
	 *     "pocetCelkem": int,
	 *     "ekonomickeSubjekty": [
	 *         {
	 *             "ico": string,
	 *             "obchodniJmeno": string,
	 *             "sidlo": {
	 *                 "kodStatu": string,
	 *                 "nazevStatu": string,
	 *                 "kodKraje": int,
	 *                 "nazevKraje": string,
	 *                 "kodOkresu": int,
	 *                 "kodObce": int,
	 *                 "nazevObce": string,
	 *                 "kodMestskehoObvodu": int,
	 *                 "nazevMestskehoObvodu": string,
	 *                 "kodMestskeCastiObvodu": int,
	 *                 "kodUlice": int,
	 *                 "nazevMestskeCastiObvodu": string,
	 *                 "nazevUlice": string,
	 *                 "cisloDomovni": int,
	 *                 "kodCastiObce": int,
	 *                 "cisloOrientacni": int,
	 *                 "nazevCastiObce": string,
	 *                 "kodAdresnihoMista": int,
	 *                 "psc": int,
	 *                 "textovaAdresa": string,
	 *                 "standardizaceAdresy": bool,
	 *                 "typCisloDomovni": int
	 *             },
	 *             "pravniForma": string,
	 *             "financniUrad": string,
	 *             "datumVzniku": string,
	 *             "datumAktualizace": string,
	 *             "dic": string,
	 *             "icoId": string,
	 *             "adresaDorucovaci": {
	 *                 "radekAdresy1": string,
	 *                 "radekAdresy2": string,
	 *                 "radekAdresy3": string
	 *             },
	 *             "seznamRegistraci": {...},
	 *             "primarniZdroj": string,
	 *             "dalsiUdaje": [...],
	 *             "czNace": string[]
	 *         }
	 *     ]
	 * }
	 * @return stdClass The raw API response
	 *
	 */
	/**
	 * @return stdClass
	 */
	public function getDataByName(string $name): stdClass {
		if (empty($name)) {
			throw BadRequest::createWithBody(
				'Invalid company name',
				ErrorBody::create()
					->withMessageTranslation(
						'invalidCompanyName',
						'Account',
						[
							'name' => $name,
						]
					)
					->encode()
			);
		}

		$requestData = [
			'obchodniJmeno' => $name,
			'pocet' => 10,
			'start' => 0,
			'razeni' => []
		];

		$response = $this->curlRequest(self::URL_BY_NAME, $requestData, true);

		try {
			/** @var stdClass|null $data */
			$data = Json::decode($response);
		} catch (\JsonException $e) {
			throw new Error('Error decoding JSON response: ' . $e->getMessage());
		}

		if ($data === null || !isset($data->ekonomickeSubjekty) || empty($data->ekonomickeSubjekty)) {
			throw ErrorSilent::createWithBody(
				'Could not find the company',
				ErrorBody::create()
					->withMessageTranslation(
						'couldNotFindCompanyByName',
						'Account',
						[
							'name' => $name,
						]
					)
					->encode()
			);
		}

		return $data;
	}

	private function getStreet(stdClass $address, bool $includeHouseNumbers = true): string {
		$nazevUlice = $address->nazevUlice ?? null;
		$cisloDomovni = $address->cisloDomovni ?? null;
		$cisloOrientacni = $address->cisloOrientacni ?? null;
		$sidloText = $address->textovaAdresa ?? null;

		// If text address exists and we're missing some components, use the text address
		if (
			$sidloText &&
			(
				$nazevUlice === null ||
				($includeHouseNumbers && $cisloDomovni === null)
			)
		) {
			$textAddressParts = explode(',', $sidloText);
			$streetPart = $textAddressParts[0];

			// If not including house numbers, try to extract just the street name
			if (!$includeHouseNumbers && preg_match('/^(.+?)\s+\d/', $streetPart, $matches)) {
				return trim($matches[1]);
			}

			return $streetPart;
		}

		$street = $nazevUlice ?? '';

		if ($includeHouseNumbers) {
			if ($cisloDomovni) {
				$street .= ' ' . $cisloDomovni;
			}

			if ($cisloOrientacni) {
				$street .= '/' . $cisloOrientacni;
			}
		}

		return $street;
	}

	/**
	 * @param  array<string, mixed>|null $postData
	 * @return string
	 */
	private function curlRequest(string $url, ?array $postData = null, bool $isJson = false): string {
		$ch = curl_init();

		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

		if ($postData !== null) {
			curl_setopt($ch, CURLOPT_POST, 1);
			if ($isJson) {
				curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
				curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
			} else {
				curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
			}
		}

		/** @var string|false $response */
		$response = curl_exec($ch);

		if (curl_errno($ch)) {
			throw new Error('cURL Error: ' . curl_error($ch));
		}

		curl_close($ch);

		return $response === false ? '' : $response;
	}
}
