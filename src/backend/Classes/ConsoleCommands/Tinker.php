<?php

namespace Espo\Modules\Viacrm\Classes\ConsoleCommands;

use Espo\Core\Console\Command;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\Container;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Metadata;
use Espo\ORM\EntityManager;
use Psy\Configuration;
use Psy\Shell;

class Tinker implements Command {

	public function __construct(
		private Container $container,
		private Config $config,
		private Metadata $metadata,
		private EntityManager $entityManager
	) {}

	public function run(Params $params, IO $io): void {
		$configFile = $this->getConfigFile();
		$config = new Configuration($configFile ? include $configFile : []);
		$shell = new Shell($config);

		// Run in transaction so that we don't risk actually deleting/updating something unknowingly
		$this->entityManager->getTransactionManager()->start();
		try {
			$shell->setScopeVariables($this->getBaseVariables());
			$shell->run();
		} finally {
			$this->entityManager->getTransactionManager()->rollback();
		}
	}

	/**
	 * @return array<string, object>
	 */
	private function getBaseVariables(): array {
		return [
		    'container' => $this->container,
		    'entityManager' => $this->entityManager,
		    'config' => $this->config,
		    'metadata' => $this->metadata,
		];
	}

	private function getConfigFile(): ?string {
		$configPaths = [
		    __DIR__ . '/TinkerConfig.php',
		    ($_SERVER['HOME'] ?? null) ? $_SERVER['HOME'] . '/.psysh.php' : null,
		];

		foreach ($configPaths as $path) {
			if ($path && file_exists($path)) {
				return $path;
			}
		}

		return null;
	}

}
