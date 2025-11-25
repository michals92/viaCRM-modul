<?php

namespace Espo\Modules\Viacrm\Tools\Vies;

use Error;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Log;
use Espo\Entities\User;

class Service {

	private const API_URL = 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms/%s/vat/%s';

	public function __construct(
		private readonly User $user,
		private readonly Log  $log,
	) {}

	/**
	 * @throws \JsonException
	 */
	public function verifyVatNumber(string $countryCode, string $vatNumber): bool {
		$this->log->debug("User {$this->user->get('name')} ({$this->user->getId()}) is verifying VAT number", [
			'countryCode' => $countryCode,
			'vatNumber' => $vatNumber,
		]);

		$url = sprintf(self::API_URL, $countryCode, $vatNumber);

		$curl = curl_init($url);
		curl_setopt($curl, CURLOPT_HTTPHEADER, ['Accept: application/json']);
		curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'GET');
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($curl, CURLOPT_TIMEOUT, 10);
		curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 10);

		$response = curl_exec($curl);

		if ($response === false) {
			throw new Error('VIES API Curl Error: ' . curl_error($curl));
		}

		$statusCode = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);

		if ($statusCode !== 200) {
			throw new Error('VIES API Error: ' . $response);
		}
		
		assert(is_string($response));

		$result = Json::decode($response);

		return $result->isValid ?? false;
	}

}
