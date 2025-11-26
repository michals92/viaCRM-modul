<?php

namespace Espo\Modules\Viacrm\Tools\EmailTemplate\ViewInBrowser;

use Espo\Core\Exceptions\Error;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Crypt;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Language;

class Processor
{
	public function __construct(
		private readonly Config $config,
		private readonly Crypt $crypt,
		private readonly Language $language,
	) {
	}

	public function process(string $content, Data $data): string
	{
		$decryptedData = Json::encode($data->getValueMap());
		$encryptedData = $this->crypt->encrypt($decryptedData);
		$siteUrl = $this->config->get('siteUrl');
		if (!$siteUrl) {
			throw new Error('Site URL is not set in config.');
		}
		$siteUrl = is_array($siteUrl) ? (string) reset($siteUrl) : (string) $siteUrl;
		$viewInBrowserUrl = $siteUrl . '?entryPoint=viewInBrowser&data=' . urlencode($encryptedData);
		$viewInBrowseLink = '<a href="' . $viewInBrowserUrl . '">' . $this->language->translateLabel('View in Browser', 'labels', 'Email') . '</a>';

		$replaceKeys = ['{viewInBrowserUrl}', '{viewInBrowserLink}'];
		$replaceValues = [$viewInBrowserUrl, $viewInBrowseLink];

		return str_replace(
			$replaceKeys,
			$replaceValues,
			$content
		);
	}
}
