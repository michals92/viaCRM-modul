<?php

namespace Espo\Modules\Viacrm\Classes\Utils;

use Espo\Core\Utils\Config;

class ExtensionUtil {
	/**
	 * @var array<string, string> Key is module name, value is module version.
	 */
	private array $installedExtensions;

	public function __construct(
		protected readonly Config $config
	) {
		$this->installedExtensions = (array) $config->get('installedExtensions', []);
	}

	/**
	 * @return array<string, string>
	 */
	public function getInstalledExtensions(): array {
		return $this->installedExtensions;
	}

	public static function fromConfig(Config $config): ExtensionUtil {
		return new self($config);
	}

	/**
	 * Checks if a specific extension is installed and meets the version requirement.
	 *
	 * @param  string $extensionName   The name of the extension to check
	 * @param  string $requiredVersion The version requirement (e.g. ">=1.0.0")
	 * @return bool   True if the extension is installed and meets the version requirement
	 */
	public function isExtensionInstalled(string $extensionName, string $requiredVersion): bool {
		if (!isset($this->installedExtensions[$extensionName])) {
			return false;
		}

		$installedVersion = $this->installedExtensions[$extensionName];

		return VersionUtil::satisfiesVersionRequirement($installedVersion, $requiredVersion);
	}

	/**
	 * @param array<string, string> $requiredExtensions Key is module name, value is module version.
	 */
	public function areAllRequiredExtensionsInstalled(array $requiredExtensions): bool {
		foreach ($requiredExtensions as $extensionName => $requiredVersion) {
			$extensionName = (string)$extensionName;

			if (!$this->isExtensionInstalled($extensionName, $requiredVersion)) {
				return false;
			}
		}

		return true;
	}
}