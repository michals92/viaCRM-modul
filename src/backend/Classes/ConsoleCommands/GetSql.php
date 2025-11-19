<?php

namespace Espo\Modules\Autocrm\Classes\ConsoleCommands;

use Espo\Core\Console\Command;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\ORM\EntityManager;

class GetSql implements Command {

	public function __construct(
		private readonly EntityManager $entityManager
	) {}

	public function run(Params $params, IO $io): void {
		$entityType = $params->getOption('entityType');
		$isList = $params->hasFlag('list');
        
		if (!$entityType) {
			$io->writeLine('Usage: php command.php get-sql --entityType=<EntityType> [--list]');
			$io->writeLine('Example: php command.php get-sql --entityType=Contact');
			$io->writeLine('Example: php command.php get-sql --entityType=Contact --list');
			$io->setExitStatus(1);

			return;
		}
        
		// Check if entity exists
		if (!$this->entityManager->getMetadata()->has($entityType)) {
			$io->writeLine("Entity '$entityType' does not exist");
			$io->setExitStatus(1);

			return;
		}
        
		try {
			// Build the select query
			$queryBuilder = $this->entityManager
			    ->getQueryBuilder()
			    ->select()
			    ->from($entityType);
            
			if ($isList) {
				// List view typically has pagination
				$queryBuilder
				    ->limit(0, 20);
			}
            
			$query = $queryBuilder->build();
            
			// Get the SQL
			$sql = $this->entityManager
			    ->getQueryComposer()
			    ->compose($query);

			$io->writeLine($sql);
		} catch (\Exception $e) {
			$io->writeLine('Error generating SQL: ' . $e->getMessage());
			$io->setExitStatus(1);

			return;
		}
	}

}