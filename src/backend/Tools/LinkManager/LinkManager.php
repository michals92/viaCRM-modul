<?php

declare(strict_types=1);

namespace Espo\Modules\Viacrm\Tools\LinkManager;

use Espo\Core\DataManager;
use Espo\Core\Utils\Metadata;
use Espo\Tools\LinkManager\LinkManager as CoreLinkManager;

/**
 * Extended LinkManager to support foreignName parameter
 */
class LinkManager extends CoreLinkManager {

	public function __construct(
		private Metadata $metadata,
		private DataManager $dataManager,
	) {
		// We only need $metadata and $dataManager for our overridden methods
		// No need to call parent constructor
	}

	/**
	 * Update link parameters including foreignName
	 *
	 * @param array{readOnly?: bool, foreignName?: string} $params
	 */
	public function updateParams(string $entityType, string $link, array $params): void {
		$type = $this->metadata->get("entityDefs.$entityType.links.$link.type");

		$defs = [];

		// Handle readOnly for hasMany/hasChildren (CORE LOGIC)
		if (
			in_array($type, ['hasMany', 'hasChildren']) &&
			array_key_exists('readOnly', $params)
		) {
			$defs['readOnly'] = $params['readOnly'];
		}

		// EXTENDED: Handle foreignName ONLY for belongsTo links
		if (
			$type === 'belongsTo' &&
			array_key_exists('foreignName', $params)
		) {
			$defs['foreignName'] = $params['foreignName'];
		}

		$this->metadata->set('entityDefs', $entityType, [
			'links' => [
				$link => $defs,
			],
		]);

		$this->metadata->save();
		$this->dataManager->clearCache();
	}

	/**
	 * Reset link parameters to default including foreignName
	 */
	public function resetToDefault(string $entityType, string $link): void {
		$this->metadata->delete('entityDefs', $entityType, [
			"links.$link.readOnly",      // CORE
			"links.$link.foreignName",   // EXTENDED
		]);

		$this->metadata->save();
		$this->dataManager->clearCache();
	}

}
