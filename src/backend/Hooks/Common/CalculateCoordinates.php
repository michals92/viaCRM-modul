<?php

namespace Espo\Modules\Viacrm\Hooks\Common;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Metadata;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements BeforeSave<Entity>
 */
class CalculateCoordinates implements BeforeSave {
	public static int $order = 9;

	protected const FIELDS = ['Street', 'City', 'State', 'PostalCode', 'Country'];

	protected const URL = 'https://maps.google.com/maps/api/geocode/json?';

	public function __construct(
		private readonly Metadata $metadata,
		private readonly Config $config
	) {}

	public function beforeSave(Entity $entity, SaveOptions $options): void {
		$addressFieldList = $this->getFieldList($entity->getEntityType());

		foreach ($addressFieldList as $addressField) {
			foreach (self::FIELDS as $field) {
				if (
					is_null($entity->get($addressField . $field . 'Lat')) || is_null($entity->get($addressField . $field . 'Lng'))
					|| $entity->getFetched($addressField . $field) !== $entity->get($addressField . $field)
				) {
					$this->adjustCoordinates($entity, $addressField);
					break;
				}
			}
		}
	}

	/**
	 * @return array<int, string>
	 */
	private function getFieldList(string $entityType): array {
		$all = $this->metadata->get(['entityDefs', $entityType, 'fields'], []);

		$filtered = array_filter(
			$all,
			static fn($fieldDef) => $fieldDef['type'] === 'address' && !empty($fieldDef['saveCoordinates'])
		);

		return array_keys($filtered);
	}

	private function adjustCoordinates(Entity $entity, string $addressField): void {
		$apiKey = $this->config->get('googleMapsApiKey');

		if (!$apiKey) {
			return;
		}

		$address = $this->composeAddress($entity, $addressField);

		if (empty(trim($address))) {
			return;
		}

		$params = [
		    'key' => $apiKey,
		    'address' => $address,
		    'sensor' => false,
		];

		$url = self::URL . http_build_query($params);

		$result = file_get_contents($url);

		if (!$result) {
			$GLOBALS['log']->error('Failed to get response from Google Maps API.');

			return;
		}

		$json = Json::decode($result);

		$GLOBALS['log']->debug('Google Maps API response', [$json]);

		// **Added error handling for API response**
		if ($json->status !== 'OK') {
			$errorMessage = $json->error_message ?? 'Unknown error';
			$GLOBALS['log']->error('Google Maps API error: ' . $errorMessage);

			return;
		}

		$location = $json->results[0]->geometry->location ?? null;

		if ($location && isset($location->lat, $location->lng)) {
			$latitude = $location->lat;
			$longitude = $location->lng;
			$entity->set($addressField . 'Lat', $latitude);
			$entity->set($addressField . 'Lng', $longitude);
		} else {
			$GLOBALS['log']->error('Could not find location in Google Maps API response.');
		}
	}

	private function composeAddress(Entity $entity, string $addressField): string {
		$parts = [];

		// Street
		$street = $entity->get($addressField . 'Street');

		if ($street) {
			$parts[] = trim($street);
		}

		// City
		$city = $entity->get($addressField . 'City');

		if ($city) {
			$parts[] = trim($city);
		}

		// State and PostalCode
		$state = $entity->get($addressField . 'State');
		$postalCode = $entity->get($addressField . 'PostalCode');
		$statePostal = '';

		if ($state) {
			$statePostal .= trim($state);
		}

		if ($postalCode) {
			$statePostal .= $state ? ' ' : '';
			$statePostal .= trim($postalCode);
		}

		if ($statePostal) {
			$parts[] = $statePostal;
		}

		// Country
		$country = $entity->get($addressField . 'Country');

		if ($country) {
			$parts[] = trim($country);
		}

		// Join all parts with a comma and space
		return implode(', ', $parts);
	}
}
