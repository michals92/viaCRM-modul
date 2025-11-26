<?php

namespace Espo\Modules\Viacrm\Tools\ZiveFirmy;

use Espo\Core\Exceptions\Error;
use Espo\Core\Utils\Json;
use stdClass;

class Service {
	public const ENDPOINT = 'https://api3.zivefirmy.cz/firmdata/';

	public function getInfo(string $sicCode, string $token): stdClass {
		$request = curl_init(self::ENDPOINT . $sicCode);

		if ($request === false) {
			throw new Error('Failed to initialize cURL');
		}

		curl_setopt($request, CURLOPT_HTTPHEADER, ["Authorization: Bearer $token"]);
		curl_setopt($request, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($request, CURLOPT_RETURNTRANSFER, true);

		$data = curl_exec($request);

		if ($data === false) {
			$error = curl_error($request);
			curl_close($request);

			throw new Error("cURL request failed: $error");
		}

		$httpCode = curl_getinfo($request, CURLINFO_HTTP_CODE);
		curl_close($request);

		if ($httpCode !== 200) {
			throw new Error("API request failed with HTTP code: $httpCode");
		}

		if (!is_string($data)) {
			throw new Error('Invalid response type from API');
		}
        
		try {
			return Json::decode($data);
		} catch (\Exception $e) {
			throw new Error('Failed to decode JSON response: ' . $e->getMessage());
		}
	}
}
