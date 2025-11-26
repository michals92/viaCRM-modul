<?php

namespace Espo\Modules\Viacrm\Tools\Extension;

use Espo\Core\Utils\Config;
use Espo\Entities\Extension as ExtensionEntity;
use Espo\ORM\EntityManager;

class Service
{
	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly Config $config
	) {
	}

	/**
	 * Get the installation status and version of a single module.
	 *
	 * @param string $moduleName name of the module to check
	 *
	 * @return array{module: string, isInstalled: bool, version: string|null} array with module status and version information
	 */
	public function getModuleStatus(string $moduleName): array
	{
		$extensionRepository = $this->entityManager->getRDBRepository(ExtensionEntity::ENTITY_TYPE);

		/** @var ExtensionEntity|null $module */
		$module = $extensionRepository->where(['name' => $moduleName])->findOne();

		$isInstalled = $module && $module->isInstalled();
		$version = $isInstalled ? $module->getVersion() : null;

		return [
			'module' => $moduleName,
			'isInstalled' => $isInstalled,
			'version' => $version,
		];
	}

	/**
	 * Get the installation status and version of specified modules.
	 *
	 * @param string[] $modulesToCheck array of module names to check
	 *
	 * @return array<array{module: string, isInstalled: bool, version: string|null}> array with module status and version information
	 */
	public function getModulesStatus(array $modulesToCheck): array
	{
		return array_map([$this, 'getModuleStatus'], $modulesToCheck);
	}

	/**
	 * Get all installed extensions.
	 *
	 * @return array<array{name: string, version: string|null}> array with module status and version information
	 */
	public function getInstalledExtensions(): array
	{
		$installedExtensions = (array) $this->config->get('installedExtensions', []);

		$result = [];
		foreach ($installedExtensions as $name => $version) {
			$result[] = [
				'name' => $name,
				'version' => $version,
			];
		}

		return $result;
	}
}
