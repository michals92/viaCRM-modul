<?php

namespace Espo\Modules\Viacrm\Core\Utils\LayoutProvider;

use Espo\Core\Utils\Config;
use Espo\Modules\Viacrm\Classes\Utils\ExtensionUtil;
use Espo\Modules\Viacrm\Classes\Utils\VersionUtil;
use Espo\Modules\Viacrm\Core\Abstract\Traits\ConditionalExtension;
use Espo\Modules\Viacrm\Core\Layout\LikeType;
use Espo\Modules\Viacrm\Tools\Layout\LayoutBuilder;

abstract class AdditionalBuilder {
	use ConditionalExtension;

	protected readonly string $layoutName;

	protected readonly string $scope;

	protected readonly ExtensionUtil $extensionUtil;

	/**
	 * @var array<string, string> Key is module name, value is module version.
	 */
	protected array $installedExtensions;

	public function __construct(
		public readonly LayoutBuilder $layoutBuilder,
		protected readonly Config     $config
	) {
		$this->scope = $layoutBuilder->getScope();
		$this->layoutName = $layoutBuilder->getLayoutName();

		$this->extensionUtil = ExtensionUtil::fromConfig($this->config);
		$this->installedExtensions = $this->extensionUtil->getInstalledExtensions();
		$this->requiredExtensions ??= [];
	}

	public function apply(): void {
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
				$this->{$methodName}();
			}
		}

		if ($allPresent) {
			$this->allPresentBuild();
		}

		$this->layoutBuilder->submitTranslationsToFrontend();
	}

	public function allPresentBuild(): void {}

	/**
	 * Adds or updates a bottom panel in the layout while respecting user customizations.
	 * This method modifies the LayoutBuilder's protected layout property using reflection.
	 *
	 * @param string               $panelName   Panel name (key in layout array)
	 * @param array<string, mixed> $panelConfig Panel configuration
	 */
	protected function addOrUpdateBottomPanelInLayoutBuilder(string $panelName, array $panelConfig): void {
		// Validate layout type
		if ($this->layoutBuilder->getType() !== LikeType::bottomsPanel) {
			throw new \LogicException(
				'addOrUpdateBottomPanelInLayoutBuilder can only be used with bottomsPanel layout type'
			);
		}

		// Use reflection to access the protected $layout property
		$reflection = new \ReflectionClass($this->layoutBuilder);
		$layoutProperty = $reflection->getProperty('layout');
		$layoutProperty->setAccessible(true);
		$layout = $layoutProperty->getValue($this->layoutBuilder);

		if (isset($layout[$panelName])) {
			// Panel exists - preserve user customizations, only add missing attributes
			$existingPanel = $layout[$panelName];

			// Only add attributes that don't exist (preserve user customizations)
			foreach ($panelConfig as $key => $value) {
				if ($key === 'index' && isset($existingPanel['index'])) {
					continue; // Preserve user's custom index
				}

				if (!isset($existingPanel[$key])) {
					$layout[$panelName][$key] = $value;
				}
			}
		} else {
			// New panel - add it
			$layout[$panelName] = $panelConfig;
		}

		// Set the modified layout back to the property
		$layoutProperty->setValue($this->layoutBuilder, $layout);
	}

}
