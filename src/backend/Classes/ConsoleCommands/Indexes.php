<?php

namespace Espo\Modules\Viacrm\Classes\ConsoleCommands;

use Espo\Core\Console\Command;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Metadata;

class Indexes implements Command {

	public function __construct(
		private readonly Metadata $metadata,
		private readonly EntityManager $entityManager
	) {}

	public function run(Params $params, IO $io): void {
		$entityType = $params->getArgument(0);
        
		if (!$entityType) {
			$io->writeLine('Usage: php command.php indexes <entityType>');
			$io->writeLine('Example: php command.php indexes Product');

			return;
		}
        
		// Check if entity exists
		if (!$this->entityManager->getMetadata()->has($entityType)) {
			$io->writeLine("Entity '$entityType' does not exist");
			$io->setExitStatus(1);

			return;
		}
        
		$indexes = $this->metadata->get(['entityDefs', $entityType, 'indexes'], []);
        
		$json = Json::encode($indexes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
		$io->writeLine($json);
	}

}