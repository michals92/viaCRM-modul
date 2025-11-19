<?php

namespace Espo\Modules\Autocrm\Core\Utils;

use Espo\Core\Utils\Config;
use Espo\Core\Utils\DataCache;
use Espo\Core\Utils\File\Manager as FileManager;
use Espo\Core\Utils\Metadata;
use Espo\Core\Utils\Resource\Reader as ResourceReader;
use Espo\Core\Utils\Resource\Reader\Params as ResourceReaderParams;
use Espo\Core\Utils\Util;
use Espo\Entities\Preferences;
use RuntimeException;

class Language extends \Espo\Core\Utils\Language {

	/** @var array<string, array<string, mixed>> */
	private array $data = [];

	/** @var array<string, array<string, mixed>> */
	private array $deletedData = [];

	/** @var array<string, array<string, mixed>> */
	private array $changedData = [];

	/** @var array<string, array<string, array<string, string>>> */
	private array $translationKeys = [];

	private string $currentLanguage;

	protected string $defaultLanguage = 'en_US';

	private string $customPath = 'custom/Espo/Custom/Resources/i18n/{language}';

	private string $resourcePath = 'i18n/{language}';

	public function __construct(
		?string                         $language,
		private readonly FileManager    $fileManager,
		private readonly ResourceReader $resourceReader,
		private readonly DataCache      $dataCache,
		private readonly Metadata       $metadata,
		protected bool                  $useCache = false,
		protected bool                  $noCustom = false
	) {
		$this->currentLanguage = $language ?? $this->defaultLanguage;
	}

	public function getLanguage(): string {
		return $this->currentLanguage;
	}

	public static function detectLanguage(Config $config, ?Preferences $preferences = null): ?string {
		$language = $preferences?->get('language');

		if (!$language) {
			$language = $config->get('language');
		}

		return $language;
	}

	/**
	 * @deprecated As of v7.4. Not to be used.
	 */
	public function setLanguage(string $language): void {
		$this->currentLanguage = $language;
	}

	private function getCacheKey(?string $language = null): string {
		return 'languages/' . ($language ?? $this->currentLanguage);
	}

	/**
	 * Translate a label.
	 *
	 * @param  string $label
	 * @param  string $category
	 * @param  string $scope
	 * @return string
	 */
	public function translateLabel(string $label, string $category = 'labels', string $scope = 'Global'): string {
		$translated = $this->translate($label, $category, $scope);

		if (is_array($translated)) {
			return implode(', ', $translated);
		}

		return $translated;
	}

	/**
	 * Translate label or labels.
	 *
	 * @param  string|string[]                       $label           A name of label.
	 * @param  string                                $category        A category.
	 * @param  string                                $scope           A scope.
	 * @param  string[]|null                         $requiredOptions A list of required options.
	 *                                                                Ex., $requiredOptions = ['en_US', 'de_DE']
	 *                                                                "language" option has only ['en_US' => 'English (United States)']
	 *                                                                Result will be ['en_US' => 'English (United States)', 'de_DE' => 'de_DE'].
	 * @return string|string[]|array<string, string>
	 */
	public function translate(
		$label,
		string $category = 'labels',
		string $scope = 'Global',
		?array $requiredOptions = null
	): array|string {
		if (is_array($label)) {
			$translated = [];

			foreach ($label as $subLabel) {
				$translated[$subLabel] = $this->translate($subLabel, $category, $scope, $requiredOptions);
			}

			/** @var string[]|array<string, string> */
			return $translated;
		}

		$key = $scope . '.' . $category . '.' . $label;

		$translated = $this->get($key);

		if (!isset($translated)) {
			$key = 'Global.' . $category . '.' . $label;
			$translated = $this->get($key, $label);
		}

		if (is_array($translated) && isset($requiredOptions)) {
			$translated = array_intersect_key($translated, array_flip($requiredOptions));

			$optionKeys = array_keys($translated);
			foreach ($requiredOptions as $option) {
				if (!in_array($option, $optionKeys, true)) {
					$translated[$option] = $option;
				}
			}
		}

		return $translated;
	}

	/**
	 * @param  int|string $value
	 * @param  string     $field
	 * @param  string     $scope
	 * @return string
	 */
	public function translateOption($value, string $field, string $scope = 'Global'): string {
		$options = $this->get($scope . '.options.' . $field);

		if (is_array($options) && array_key_exists($value, $options)) {
			return $options[$value];
		}

		if ($scope !== 'Global') {
			$options = $this->get('Global.options.' . $field);

			if (is_array($options) && array_key_exists($value, $options)) {
				return $options[$value];
			}
		}

		return (string)$value;
	}

	/**
	 *
	 * @param  string|string[]|null $key
	 * @param  mixed                $returns
	 * @return mixed
	 */
	public function get($key = null, $returns = null): mixed {
		$data = $this->getData();

		if (!isset($data)) {
			throw new RuntimeException('Language: current language ' . $this->currentLanguage . ' not found');
		}

		return Util::getValueByKey($data, $key, $returns);
	}

	/**
	 * Save changes.
	 */
	public function save(): bool {
		$path = str_replace('{language}', $this->currentLanguage, $this->customPath);

		$result = true;

		if (!empty($this->changedData)) {
			foreach ($this->changedData as $scope => $data) {
				if (empty($data)) {
					continue;
				}

				$result &= $this->fileManager->mergeJsonContents($path . "/$scope.json", $data);
			}
		}

		if (!empty($this->deletedData)) {
			foreach ($this->deletedData as $scope => $unsetData) {
				if (empty($unsetData)) {
					continue;
				}

				$result &= $this->fileManager->unsetJsonContents($path . "/$scope.json", $unsetData);
			}
		}

		$this->clearChanges();

		return (bool)$result;
	}

	/**
	 * Clear unsaved changes.
	 */
	public function clearChanges(): void {
		$this->changedData = [];
		$this->deletedData = [];

		$this->init(true);
	}

	/**
	 * @return ?array<string, mixed>
	 */
	private function getData(): ?array {
		$currentLanguage = $this->currentLanguage;

		if (!isset($this->data[$currentLanguage])) {
			$this->init();
		}

		return $this->data[$currentLanguage] ?? null;
	}

	/**
	 * Set/change a label.
	 *
	 * @param string|array<string, string> $name
	 * @param mixed                        $value
	 */
	public function set(string $scope, string $category, $name, $value): void {
		if (is_array($name)) {
			foreach ($name as $rowLabel => $rowValue) {
				$this->set($scope, $category, $rowLabel, $rowValue);
			}

			return;
		}

		$this->changedData[$scope][$category][$name] = $value;

		$currentLanguage = $this->currentLanguage;

		if (!isset($this->data[$currentLanguage])) {
			$this->init();
		}

		$this->data[$currentLanguage][$scope][$category][$name] = $value;

		$this->undelete($scope, $category, $name);
	}

	/**
	 * Remove a label.
	 *
	 * @param string          $scope
	 * @param string          $category
	 * @param string|string[] $name
	 */
	public function delete(string $scope, string $category, $name): void {
		if (is_array($name)) {
			foreach ($name as $rowLabel) {
				$this->delete($scope, $category, $rowLabel);
			}

			return;
		}

		$this->deletedData[$scope][$category][] = $name;

		$currentLanguage = $this->currentLanguage;

		if (!isset($this->data[$currentLanguage])) {
			$this->init();
		}

		if (isset($this->data[$currentLanguage][$scope][$category][$name])) {
			unset($this->data[$currentLanguage][$scope][$category][$name]);
		}

		if (isset($this->changedData[$scope][$category][$name])) {
			unset($this->changedData[$scope][$category][$name]);
		}
	}

	private function undelete(string $scope, string $category, string $name): void {
		if (isset($this->deletedData[$scope][$category])) {
			foreach ($this->deletedData[$scope][$category] as $key => $labelName) {
				if ($name === $labelName) {
					unset($this->deletedData[$scope][$category][$key]);
				}
			}
		}
	}

	private function init(bool $reload = false): void {
		$this->data[$this->currentLanguage] = $this->getLanguageData($this->currentLanguage, $reload);
	}

	/**
	 * @return array<string, mixed>
	 */
	private function getDefaultLanguageData(bool $reload = false): array {
		return $this->getLanguageData($this->defaultLanguage, $reload);
	}

	/**
	 * @return array<string, mixed>
	 */
	private function getLanguageData(string $language, bool $reload = false): array {
		if (!$reload && isset($this->data[$language])) {
			return $this->data[$language];
		}

		$cacheKey = $this->getCacheKey($language);

		if ($reload || !$this->useCache || !$this->dataCache->has($cacheKey)) {
			$readerParams = ResourceReaderParams
				::create()
				->withNoCustom($this->noCustom);

			$path = str_replace('{language}', $language, $this->resourcePath);

			$data = $this->resourceReader->readAsArray($path, $readerParams);

			if ($language !== $this->defaultLanguage) {
				/** @var array<string, array<string, mixed>> $data */
				$data = Util::merge($this->getDefaultLanguageData($reload), $data);

				foreach ($this->iterateTranslationKeys() as [$entityType, $categoryName, $keyName, $translationKey]) {
					$this->translateTranslationKey($data, $entityType, $categoryName, $keyName, $translationKey);
				}
			}

			$this->data[$language] = $data;

			if ($this->useCache) {
				$this->dataCache->store($cacheKey, $data);
			}
		}

		if ($this->useCache) {
			/** @var array<string, mixed> $cachedData */
			$cachedData = $this->dataCache->get($cacheKey);

			$this->data[$language] = $cachedData;
		}

		return $this->data[$language] ?? [];
	}

	/**
	 * @param array<string, array<string, mixed>> $data
	 */
	private function translateTranslationKey(array &$data, string $scope, string $categoryName, string $keyName, string $translationKey): void {
		$array = explode('.', $translationKey);
		$value = $data;
		foreach ($array as $key) {
			if (isset($value[$key])) {
				$value = $value[$key];
			} else {
				$GLOBALS['log']->warning("[Autocrm|Utils/Language/$scope] TranslationKey value not found: $translationKey");

				return;
			}
		}
		$data[$scope] ??= [];
		$data[$scope][$categoryName] ??= [];
		$data[$scope][$categoryName][$keyName] ??= $value;
	}

	/**
	 * @return array<string, array<string, array<string, string>>>
	 */
	public function getTranslationKeysEntries(): array {
		if ($this->translationKeys) {
			return $this->translationKeys;
		}

		$translationKeys = [];
		$entityDefs = $this->metadata->get('entityDefs', []);
		foreach ($entityDefs as $entityType => $entityDef) {
			if (empty($entityDef['fields'])) {
				continue;
			}

			foreach ($entityDef['fields'] as $fieldName => $fieldDef) {
				if (
					(isset($fieldDef['translationKey'])) &&
					($translationKey = $fieldDef['translationKey'])
				) {
					$translationKeys[$entityType] ??= [];
					$translationKeys[$entityType]['fields'] ??= [];
					$translationKeys[$entityType]['fields'][$fieldName] = $translationKey;
				}
			}
		}

		return $this->translationKeys = $translationKeys;
	}

	public function iterateTranslationKeys(): \Generator {
		foreach ($this->getTranslationKeysEntries() as $entityType => $categories) {
			foreach ($categories as $categoryName => $categoryData) {
				foreach ($categoryData as $fieldName => $translationKey) {
					yield [
						$entityType,
						$categoryName,
						$fieldName,
						$translationKey
					];
				}
			}
		}
	}

}