<?php

namespace Espo\Modules\Viacrm\Core\Utils\Metadata\AdditionalBuilder;

use Espo\Core\Utils\Config;
use Espo\Core\Utils\Config\ConfigFileManager;
use Espo\Core\Utils\File\Manager as FileManager;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Metadata\AdditionalBuilder;
use stdClass;

/**
 *  To be extended by AdditionalBuilder implementors that need to use the Config class.
 */
abstract class AdditionalBuilderWithConfig implements AdditionalBuilder
{
	protected readonly Config $config;

	protected FileManager $fileManager;

	/**
	 * Cache for custom metadata files to avoid redundant file reads.
	 * Format: ["{metadataType}:{entityType}" => stdClass|null].
	 *
	 * @var array<string, stdClass|null>
	 */
	private array $customMetadataCache = [];

	public function __construct()
	{
		// AdditionalBuilders cannot have constructors with parameters
		$this->fileManager = new FileManager();

		$configFileManager = new ConfigFileManager();

		$this->config = new Config($configFileManager);
	}

	abstract public function build(stdClass $data): void;

	/**
	 * Get custom metadata value for dynamically generated fields/links.
	 *
	 * This solves a specific problem: When an AdditionalBuilder dynamically generates
	 * a link or field definition, and a user later customizes it via Entity Manager
	 * (e.g., changes foreignName), the custom value gets saved to
	 * custom/Espo/Custom/Resources/metadata/entityDefs/{Entity}.json.
	 *
	 * However, EspoCRM ignores this custom metadata during the merge phase because
	 * the link/field definition is incomplete (missing type, entity, foreign properties).
	 * As a result, the custom value is not present in the $data object passed to
	 * AdditionalBuilders, and the AdditionalBuilder would overwrite it with the default.
	 *
	 * This method reads custom metadata files directly, bypassing the merge issue,
	 * and caches the results for performance.
	 *
	 * Example usage:
	 * ```php
	 * $foreignName = $this->getCustomMetadataValue(
	 *     'PurchaseOrderItem',
	 *     'entityDefs',
	 *     ['links', 'productionOrder', 'foreignName'],
	 *     'referenceIdentifier'
	 * );
	 * ```
	 *
	 * @param string                 $entityType   The entity type (e.g., 'PurchaseOrderItem')
	 * @param string                 $metadataType Metadata type (e.g., 'entityDefs', 'clientDefs', 'recordDefs')
	 * @param array<int, string|int> $path         Path to the value (e.g., ['links', 'productionOrder', 'foreignName'])
	 * @param mixed                  $default      Default value if not found or file doesn't exist
	 *
	 * @return mixed The custom value from the file, or $default if not found
	 */
	protected function getCustomMetadataValue(
		string $entityType,
		string $metadataType,
		array $path,
		mixed $default = null
	): mixed {
		$cacheKey = "{$metadataType}:{$entityType}";

		// Load and cache file if not already cached
		if (!isset($this->customMetadataCache[$cacheKey])) {
			$customFilePath = "custom/Espo/Custom/Resources/metadata/{$metadataType}/{$entityType}.json";

			if (!$this->fileManager->isFile($customFilePath)) {
				$this->customMetadataCache[$cacheKey] = null;

				return $default;
			}

			try {
				$customContent = $this->fileManager->getContents($customFilePath);
				$this->customMetadataCache[$cacheKey] = Json::decode($customContent, false);
			} catch (\Throwable $e) {
				// If JSON parsing fails, cache null and return default
				$this->customMetadataCache[$cacheKey] = null;

				return $default;
			}
		}

		// If no custom data cached (file didn't exist or parse failed), return default
		if ($this->customMetadataCache[$cacheKey] === null) {
			return $default;
		}

		// Traverse path (supports both objects and arrays)
		$current = $this->customMetadataCache[$cacheKey];
		foreach ($path as $key) {
			if (is_object($current)) {
				if (!property_exists($current, (string) $key)) {
					return $default;
				}
				$current = $current->$key;
			} elseif (is_array($current)) {
				if (!array_key_exists($key, $current)) {
					return $default;
				}
				$current = $current[$key];
			} else {
				return $default;
			}
		}

		return $current;
	}

	/**
	 * Convenience method to get custom link property from entityDefs.
	 *
	 * Equivalent to calling getCustomMetadataValue() with 'entityDefs' and
	 * ['links', $linkName, $property] path.
	 *
	 * Example:
	 * ```php
	 * $foreignName = $this->getCustomLinkProperty(
	 *     'PurchaseOrderItem',
	 *     'productionOrder',
	 *     'foreignName',
	 *     'referenceIdentifier'
	 * );
	 * ```
	 *
	 * @param string $entityType The entity type (e.g., 'PurchaseOrderItem')
	 * @param string $linkName   The link name (e.g., 'productionOrder')
	 * @param string $property   The property name (e.g., 'foreignName', 'audited')
	 * @param mixed  $default    Default value if not found
	 *
	 * @return mixed The custom value or $default
	 */
	protected function getCustomLinkProperty(
		string $entityType,
		string $linkName,
		string $property,
		mixed $default = null
	): mixed {
		return $this->getCustomMetadataValue(
			$entityType,
			'entityDefs',
			['links', $linkName, $property],
			$default
		);
	}

	/**
	 * Convenience method to get custom field property from entityDefs.
	 *
	 * Equivalent to calling getCustomMetadataValue() with 'entityDefs' and
	 * ['fields', $fieldName, $property] path.
	 *
	 * Example:
	 * ```php
	 * $isReadOnly = $this->getCustomFieldProperty(
	 *     'Account',
	 *     'name',
	 *     'readOnly',
	 *     false
	 * );
	 * ```
	 *
	 * @param string $entityType The entity type (e.g., 'Account')
	 * @param string $fieldName  The field name (e.g., 'name')
	 * @param string $property   The property name (e.g., 'readOnly', 'required')
	 * @param mixed  $default    Default value if not found
	 *
	 * @return mixed The custom value or $default
	 */
	protected function getCustomFieldProperty(
		string $entityType,
		string $fieldName,
		string $property,
		mixed $default = null
	): mixed {
		return $this->getCustomMetadataValue(
			$entityType,
			'entityDefs',
			['fields', $fieldName, $property],
			$default
		);
	}

	/**
	 * Apply all custom link properties from Entity Manager customizations.
	 *
	 * This method reads ALL properties from the custom metadata file for a specific link
	 * and applies them to the $data object. This allows Entity Manager customizations
	 * (e.g., foreignName, audited) to be preserved.
	 *
	 * IMPORTANT: Call this method BEFORE setting structural properties (type, entity, foreign)
	 * to ensure structural properties always take precedence and cannot be overridden
	 * by potentially malformed custom metadata.
	 *
	 * Recommended usage pattern:
	 * ```php
	 * // 1. Set behavioral defaults
	 * $data->entityDefs->PurchaseOrderItem->links->productionOrder->foreignName = 'referenceIdentifier';
	 * $data->entityDefs->PurchaseOrderItem->links->productionOrder->audited = false;
	 *
	 * // 2. Apply Entity Manager customizations (overwrites behavioral defaults)
	 * $this->applyCustomLinkProperties($data, 'PurchaseOrderItem', 'productionOrder');
	 *
	 * // 3. Set structural properties LAST (ensures they cannot be overridden)
	 * $data->entityDefs->PurchaseOrderItem->links->productionOrder->type = 'belongsTo';
	 * $data->entityDefs->PurchaseOrderItem->links->productionOrder->foreign = 'purchaseOrderItems';
	 * $data->entityDefs->PurchaseOrderItem->links->productionOrder->entity = 'ProductionOrder';
	 * ```
	 *
	 * @param stdClass $data       The metadata data object to modify
	 * @param string   $entityType The entity type (e.g., 'PurchaseOrderItem')
	 * @param string   $linkName   The link name (e.g., 'productionOrder')
	 *
	 * @return void
	 */
	protected function applyCustomLinkProperties(
		stdClass $data,
		string $entityType,
		string $linkName
	): void {
		$customLink = $this->getCustomMetadataValue(
			$entityType,
			'entityDefs',
			['links', $linkName]
		);

		if ($customLink === null || !is_object($customLink)) {
			return;
		}

		// Apply all custom properties from Entity Manager
		foreach (get_object_vars($customLink) as $property => $value) {
			$data->entityDefs->{$entityType}->links->{$linkName}->{$property} = $value;
		}
	}

	/**
	 * Apply all custom field properties from Entity Manager customizations.
	 *
	 * This method reads ALL properties from the custom metadata file for a specific field
	 * and applies them to the $data object. This allows Entity Manager customizations
	 * (e.g., compact, required, readOnly) to be preserved.
	 *
	 * IMPORTANT: Call this method BEFORE setting structural properties (type)
	 * to ensure structural properties always take precedence.
	 *
	 * Recommended usage pattern:
	 * ```php
	 * // 1. Set behavioral defaults
	 * $data->entityDefs->PurchaseOrderItem->fields->productionOrder->compact = true;
	 * $data->entityDefs->PurchaseOrderItem->fields->productionOrder->required = false;
	 *
	 * // 2. Apply Entity Manager customizations (overwrites behavioral defaults)
	 * $this->applyCustomFieldProperties($data, 'PurchaseOrderItem', 'productionOrder');
	 *
	 * // 3. Set structural properties LAST (ensures they cannot be overridden)
	 * $data->entityDefs->PurchaseOrderItem->fields->productionOrder->type = 'link';
	 * ```
	 *
	 * @param stdClass $data       The metadata data object to modify
	 * @param string   $entityType The entity type (e.g., 'PurchaseOrderItem')
	 * @param string   $fieldName  The field name (e.g., 'productionOrder')
	 *
	 * @return void
	 */
	protected function applyCustomFieldProperties(
		stdClass $data,
		string $entityType,
		string $fieldName
	): void {
		$customField = $this->getCustomMetadataValue(
			$entityType,
			'entityDefs',
			['fields', $fieldName]
		);

		if ($customField === null || !is_object($customField)) {
			return;
		}

		// Apply all custom properties from Entity Manager
		foreach (get_object_vars($customField) as $property => $value) {
			$data->entityDefs->{$entityType}->fields->{$fieldName}->{$property} = $value;
		}
	}
}
