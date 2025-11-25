<?php

namespace Espo\Modules\Viacrm\Classes\ConsoleCommands;

use Espo\Core\Console\Command;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\Record\ServiceContainer as RecordServiceContainer;
use Espo\Core\Select\SearchParams;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Metadata;
use Espo\Modules\Viacrm\Tools\Layout\AttributeExtractor;

class TextSearch implements Command {

	public function __construct(
		private readonly RecordServiceContainer $recordServiceContainer,
		private readonly Metadata $metadata,
		private readonly AttributeExtractor $attributeExtractor
	) {}

	public function run(Params $params, IO $io): void {
		$entityType = $params->getArgument(0);
		$textFilter = $params->getArgument(1);

		if (!$entityType || !$textFilter) {
			$io->writeLine('Usage: php command.php text-search <EntityType> <TextFilter>');
			$io->writeLine('Example: php command.php text-search Contact "John Doe"');
			$io->writeLine('Example: php command.php text-search Contact "ft:John Doe"');
			$io->setExitStatus(1);

			return;
		}

		// Check if entity exists
		if (!$this->metadata->get(['entityDefs', $entityType])) {
			$io->writeLine("Entity '$entityType' does not exist");
			$io->setExitStatus(1);

			return;
		}

		try {
			// Get attributes from the list layout using AttributeExtractor
			$selectAttributeList = $this->attributeExtractor->extractAttributesFromLayout($entityType, 'list');
            
			// Always include id if not already in the list
			if (!in_array('id', $selectAttributeList)) {
				array_unshift($selectAttributeList, 'id');
			}
            
			// If no attributes found, use a minimal set
			if (count($selectAttributeList) === 1) {
				// Just has 'id', add name if it exists
				if ($this->metadata->get(['entityDefs', $entityType, 'fields', 'name'])) {
					$selectAttributeList[] = 'name';
				}
			}

			// Create search params with text filter
			$searchParams = SearchParams::create()
			    ->withTextFilter($textFilter)
			    ->withSelect($selectAttributeList)
			    ->withMaxSize(20); // Default list view limit

			// Get the record service for the entity type
			$recordService = $this->recordServiceContainer->get($entityType);

			// Execute the search
			$recordCollection = $recordService->find($searchParams);

			// Output the results
			$result = [
			    'total' => $recordCollection->getTotal(),
			    'list' => $recordCollection->getValueMapList()
			];

			$io->writeLine(Json::encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
		} catch (\Exception $e) {
			$io->writeLine('Error executing search: ' . $e->getMessage());
			$io->writeLine('Stack trace: ' . $e->getTraceAsString());
			$io->setExitStatus(1);

			return;
		}
	}

}