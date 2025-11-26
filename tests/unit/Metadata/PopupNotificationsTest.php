<?php

namespace Tests\Unit\Metadata;

use Espo\Tools\PopupNotification\Provider as PopupNotificationProvider;

/**
 * Tests for app/popupNotifications.json metadata.
 */
class PopupNotificationsTest extends AbstractMetadataTest
{
	/**
	 * Test that all notification providers implement the Provider interface.
	 */
	public function testNotificationProvidersImplementInterface(): void
	{
		$this->processMetadataFiles('app/popupNotifications.json', function ($data, $file) {
			$this->assertIsArray(
				$data,
				'popupNotifications.json content should be an array'
			);

			// Check each notification type
			foreach ($data as $notificationType => $notificationConfig) {
				$this->assertIsArray(
					$notificationConfig,
					"Notification type '$notificationType' config must be an array"
				);

				// Check for the providerClassName property
				$this->assertArrayHasKey(
					'providerClassName',
					$notificationConfig,
					"Notification type '$notificationType' is missing 'providerClassName' property"
				);

				$providerClass = $notificationConfig['providerClassName'];

				$this->assertIsString(
					$providerClass,
					"providerClassName for notification type '$notificationType' must be a string"
				);

				// Check if the provider class exists
				$this->assertTrue(
					class_exists($providerClass),
					"Provider class '$providerClass' for notification type '$notificationType' does not exist"
				);

				// Check if the provider implements the Provider interface
				$reflection = new \ReflectionClass($providerClass);
				$this->assertTrue(
					$reflection->implementsInterface(PopupNotificationProvider::class),
					"Provider class '$providerClass' for notification type '$notificationType' must implement " .
					PopupNotificationProvider::class
				);

				// Check namespace pattern
				$this->assertMatchesRegularExpression(
					'/^Espo\\\\Modules\\\\Viacrm\\\\Tools\\\\[A-Za-z0-9]+\\\\NotificationProvider$/',
					$providerClass,
					"Provider class '$providerClass' does not follow expected namespace pattern"
				);
			}
		});
	}

	/**
	 * Test that popupNotifications.json entries have the expected structure.
	 */
	public function testPopupNotificationsStructure(): void
	{
		$this->processMetadataFiles('app/popupNotifications.json', function ($data, $file) {
			$this->assertIsArray(
				$data,
				'popupNotifications.json content should be an array'
			);

			// Make sure at least one notification type is defined
			$this->assertGreaterThan(
				0,
				count($data),
				'There should be at least one notification type defined'
			);

			// Check each notification type
			foreach ($data as $notificationType => $notificationConfig) {
				$this->assertIsArray(
					$notificationConfig,
					"Notification type '$notificationType' config must be an array"
				);

				// Required properties
				$requiredProperties = [
					'interval',
					'providerClassName',
					'view',
				];

				foreach ($requiredProperties as $property) {
					$this->assertArrayHasKey(
						$property,
						$notificationConfig,
						"Notification type '$notificationType' is missing required '$property' property"
					);
				}

				// Type checks
				$this->assertIsNumeric(
					$notificationConfig['interval'],
					"Notification type '$notificationType' 'interval' must be numeric"
				);

				$this->assertIsString(
					$notificationConfig['providerClassName'],
					"Notification type '$notificationType' 'providerClassName' must be a string"
				);

				$this->assertIsString(
					$notificationConfig['view'],
					"Notification type '$notificationType' 'view' must be a string"
				);

				// Optional properties types
				if (array_key_exists('grouped', $notificationConfig)) {
					$this->assertIsBool(
						$notificationConfig['grouped'],
						"Notification type '$notificationType' 'grouped' must be a boolean"
					);
				}

				if (array_key_exists('disabled', $notificationConfig)) {
					$this->assertIsBool(
						$notificationConfig['disabled'],
						"Notification type '$notificationType' 'disabled' must be a boolean"
					);
				}

				if (array_key_exists('portalDisabled', $notificationConfig)) {
					$this->assertIsBool(
						$notificationConfig['portalDisabled'],
						"Notification type '$notificationType' 'portalDisabled' must be a boolean"
					);
				}

				if (array_key_exists('useWebSocket', $notificationConfig)) {
					$this->assertIsBool(
						$notificationConfig['useWebSocket'],
						"Notification type '$notificationType' 'useWebSocket' must be a boolean"
					);
				}
			}
		});
	}
}
