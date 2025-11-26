<?php

namespace Espo\Modules\Viacrm\Core\Utils\Metadata\AdditionalBuilder\Abstract;

use Espo\Modules\Viacrm\Classes\Utils\ExtensionUtil;
use Espo\Modules\Viacrm\Classes\Utils\VersionUtil;
use Espo\Modules\Viacrm\Core\Abstract\Traits\ConditionalExtension;
use Espo\Modules\Viacrm\Core\Utils\Metadata\AdditionalBuilder\AdditionalBuilderWithConfig;
use stdClass;

/**
 *  To be extended by AdditionalBuilder implementors that need to be called dynamically
 */
abstract class ConditionalAdditionalBuilder extends AdditionalBuilderWithConfig {
	use ConditionalExtension;

	protected readonly ExtensionUtil $extensionUtil;

	/**
	 * @var array<string, string> Key is module name, value is module version.
	 */
	protected array $installedExtensions;

	public function __construct() {
		parent::__construct();

		$this->extensionUtil = ExtensionUtil::fromConfig($this->config);
		$this->installedExtensions = $this->extensionUtil->getInstalledExtensions();
	}

	public function allPresentBuild(stdClass $data): void {}

	/** @internal */
	public function build(stdClass $data): void {
		$allPresent = true;

		foreach ($this->requiredExtensions as $extensionName => $requiredVersion) {
			$extensionName = (string)$extensionName;

			if (!isset($this->installedExtensions[$extensionName])) {
				$allPresent = false;
				continue;
			}

			$installedVersion = $this->installedExtensions[$extensionName];

			if (!VersionUtil::satisfiesVersionRequirement($installedVersion, $requiredVersion)) {
				$allPresent = false;
				continue;
			}

			$methodName = "build{$extensionName}";

			if (method_exists($this, $methodName)) {
				$this->{$methodName}($data);
			}
		}

		if ($allPresent) {
			$this->allPresentBuild($data);
		}
	}
}
