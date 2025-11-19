<?php

namespace Espo\Modules\Autocrm\Classes\ConsoleCommands;

use Espo\Core\Console\Command;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Metadata;
use Espo\Tools\Layout\LayoutProvider;

class ListLayouts implements Command {

	// Base layout types from EspoCRM frontend
	private const BASE_LAYOUT_TYPES = [
		'list',
		'detail',
		'listSmall',
		'detailSmall',
		'defaultSidePanel',
		'bottomPanelsDetail',
		'filters',
		'massUpdate',
		'sidePanelsDetail',
		'sidePanelsEdit',
		'sidePanelsDetailSmall',
		'sidePanelsEditSmall',
	];

	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly LayoutProvider $layoutProvider,
		private readonly Metadata $metadata
	) {}

	public function run(Params $params, IO $io): void {
		$entityType = $params->getArgument(0);
        
		if (!$entityType) {
			$io->writeLine('Usage: php command.php listLayouts <entityType>');
			$io->writeLine('Example: php command.php listLayouts Contact');

			return;
		}
        
		// Check if entity exists
		if (!$this->entityManager->hasRepository($entityType)) {
			$io->writeLine("Entity '$entityType' does not exist");
			$io->setExitStatus(1);

			return;
		}
        
		$availableLayouts = $this->getAvailableLayouts($entityType);
        
		// Output just the layout names, one per line
		foreach ($availableLayouts as $layoutName) {
			$io->writeLine($layoutName);
		}
	}
    
	/**
	 * Get available layouts for an entity type following EspoCRM's discovery logic
	 * @param  string        $entityType
	 * @return array<string>
	 */
	private function getAvailableLayouts(string $entityType): array {
		$layouts = self::BASE_LAYOUT_TYPES;
        
		// Add bottomPanelsEdit if metadata exists
		if ($this->metadata->get(['clientDefs', $entityType, 'bottomPanels', 'edit'])) {
			$layouts[] = 'bottomPanelsEdit';
		}
        
		// Remove defaultSidePanel if disabled or has field list
		if ($this->metadata->get(['clientDefs', $entityType, 'defaultSidePanelDisabled']) ||
		    $this->metadata->get(['clientDefs', $entityType, 'defaultSidePanelFieldList'])) {
			$layouts = array_diff($layouts, ['defaultSidePanel']);
		}
        
		// Add kanban if enabled
		if ($this->metadata->get(['clientDefs', $entityType, 'kanbanViewMode'])) {
			$layouts[] = 'kanban';
		}
        
		// Add additional layouts from metadata
		$additionalLayouts = $this->metadata->get(['clientDefs', $entityType, 'additionalLayouts']) ?? [];
		foreach ($additionalLayouts as $layoutName => $layoutConfig) {
			if (!in_array($layoutName, $layouts)) {
				$layouts[] = $layoutName;
			}
		}
        
		// Filter out disabled layouts and non-existent layouts
		$filteredLayouts = [];
		foreach ($layouts as $layoutName) {
			$disabledKey = 'layout' . ucfirst($layoutName) . 'Disabled';
			if (!$this->metadata->get(['clientDefs', $entityType, $disabledKey])) {
				// Check if the layout actually exists
				$layoutJson = $this->layoutProvider->get($entityType, $layoutName);
				if ($layoutJson !== null) {
					$filteredLayouts[] = $layoutName;
				}
			}
		}
        
		return array_values($filteredLayouts);
	}

}