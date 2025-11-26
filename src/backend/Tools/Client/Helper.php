<?php

namespace Espo\Modules\Viacrm\Tools\Client;

use Espo\Core\Utils\ClientManager;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Language as LanguageUtil;
use Espo\Core\Utils\Metadata;
use Espo\Core\Utils\ThemeManager;
use Espo\Entities\Preferences;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Viacrm\Classes\VariableCss\Provider as VariableCssProvider;
use RuntimeException;

class Helper {
	public function __construct(
		private readonly Metadata $metadata,
		private readonly Config $config,
		private readonly Preferences $preferences,
		private readonly VariableCssProvider $variableCssProvider,
		private readonly ThemeManager $themeManager
	) {}

	/**
	 * @param  array<string, mixed> $vars
	 * @return array<string, mixed>
	 */
	public function prepareVars(ClientManager $clientManager, array $vars = []): array {
		$extensionMap = $this->metadata->get(['app', 'client', 'viewExtensions'], []);
		$lang = LanguageUtil::detectLanguage($this->config, $this->preferences) ?? throw new RuntimeException('No language not detected');
		$appTimestamp = ReflectionUtil::callClassMethod(ClientManager::class, $clientManager, 'getAppTimestamp');

		$themeName = $this->themeManager->getName();

		$additionalThemeStyleSheets = $this->metadata->get(['themes', $themeName, 'additionalStyleSheets'], []);

		$additionalThemeStyleSheetsHtml = implode('',
			array_map(
				fn ($file) => ReflectionUtil::callClassMethod(ClientManager::class, $clientManager, 'getCssItemHtml', $file, $appTimestamp),
				$additionalThemeStyleSheets)
		);

		$variableCss = $this->variableCssProvider->getCss();

		// fallback to null so that the theme is properly replaced in the main template for older Espo versions
		$theme = $vars['theme'] ?? Json::encode(null);

		$vars = array_merge($vars, [
		    'variableCss' => $variableCss,
		    'extensionViews' => Json::encode($extensionMap),
		    'additionalThemeStyleSheetsHtml' => $additionalThemeStyleSheetsHtml,
		    'lang' => strtok($lang, '_'),
			'theme' => $theme
		]);

		return $vars;
	}
}
