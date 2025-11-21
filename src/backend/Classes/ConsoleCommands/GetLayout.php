<?php

namespace Espo\Modules\Autocrm\Classes\ConsoleCommands;

use Espo\Core\Console\Command;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Json;
use Espo\Tools\Layout\LayoutProvider;

class GetLayout implements Command {

	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly LayoutProvider $layoutProvider
	) {}

	public function run(Params $params, IO $io): void {
		$entityType = $params->getArgument(0);
		$layoutName = $params->getArgument(1);
        
		if (!$entityType || !$layoutName) {
			$io->writeLine('Usage: php command.php getLayout <entityType> <layoutName>');
			$io->writeLine('Example: php command.php getLayout Opportunity sidePanelsDetail');
			$io->writeLine('');
			$io->writeLine('Common layout names:');
			$io->writeLine('  detail           - Detail view layout');
			$io->writeLine('  list             - List view layout');
			$io->writeLine('  listSmall        - Small list view layout');
			$io->writeLine('  detailSmall      - Small detail view layout');
			$io->writeLine('  massUpdate       - Mass update form layout');
			$io->writeLine('  filters          - Filter panel layout');
			$io->writeLine('  relationships    - Relationship panels layout');
			$io->writeLine('  sidePanelsDetail - Side panels for detail view');
			$io->writeLine('  sidePanelsEdit   - Side panels for edit view');
			$io->writeLine('  kanban           - Kanban view layout');

			return;
		}
        
		// Check if entity exists
		if (!$this->entityManager->hasRepository($entityType)) {
			$io->writeLine("Entity '$entityType' does not exist");
			$io->setExitStatus(1);

			return;
		}
        
		// Get layout data
		$layoutJson = $this->layoutProvider->get($entityType, $layoutName);
        
		if ($layoutJson === null) {
			$io->writeLine("Layout '$layoutName' for entity '$entityType' not found");
			$io->setExitStatus(1);

			return;
		}
        
		// Parse and pretty print
		$layoutData = Json::decode($layoutJson);
		$prettyJson = Json::encode($layoutData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
		$io->writeLine($prettyJson);
	}

}