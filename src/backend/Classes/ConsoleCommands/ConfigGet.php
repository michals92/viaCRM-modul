<?php

namespace Espo\Modules\Viacrm\Classes\ConsoleCommands;

use Espo\Core\Console\Command;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Json;

class ConfigGet implements Command {

	public function __construct(
		private readonly Config $config
	) {}

	public function run(Params $params, IO $io): void {
		$key = $params->getArgument(0);
        
		if (!$key) {
			$io->writeLine('Usage: php command.php configGet <key>');
			$io->writeLine('Example: php command.php configGet language');
			$io->writeLine('Example: php command.php configGet database.driver');

			return;
		}
        
		// Get value using built-in dot notation support
		$value = $this->config->get($key);
		
		// Output value as JSON
		$json = Json::encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		
		$io->writeLine($json);
		
		// Set exit status based on whether key was found
		if ($value === null && !$this->config->has($key)) {
			$io->setExitStatus(1);
		}
	}

}