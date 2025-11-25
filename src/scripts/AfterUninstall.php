<?php

use Espo\Core\Container;
use Espo\Core\DataManager;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Config\ConfigWriter;
use Espo\Modules\Viacrm\Core\Log\ViacrmFormatter;

class AfterUninstall {

	private Config $config;

	private ConfigWriter $configWriter;

	private DataManager $dataManager;

	/**
	 * @param array<string, mixed> $params
	 */
	public function run(Container $container, array $params = []): void {
		$this->loadDependencies($container);

		$this->removeCustomFormatter();

		$this->clearCache();
	}

	private function loadDependencies(Container $container): void {
		$injectableFactory = $container->getByClass(InjectableFactory::class);

		$this->config = $container->getByClass(Config::class);
		$this->configWriter = $injectableFactory->create(ConfigWriter::class);

		$this->dataManager = $container->getByClass(DataManager::class);
	}

	private function removeCustomFormatter(): void {
		$loggerData = $this->config->get('logger', []);

		$handlerList = $loggerData['handlerList'];

		foreach ($handlerList as $key => $handler) {
			if ($handler['formatter'] && $handler['formatter']['className'] === ViacrmFormatter::class) {
				unset($handlerList[$key]['formatter']['className']);
			}
		}

		$loggerData['handlerList'] = $handlerList;

		$this->configWriter->set('logger', $loggerData);

		$this->configWriter->save();
	}

	private function clearCache(): void {
		try {
			$this->dataManager->clearCache();
		} catch (\Exception) {
		}
	}

}
