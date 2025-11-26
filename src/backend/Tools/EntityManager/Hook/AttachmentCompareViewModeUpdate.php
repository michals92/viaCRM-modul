<?php

namespace Espo\Modules\Viacrm\Tools\EntityManager\Hook;

use Espo\Core\Utils\Json;
use Espo\Tools\EntityManager\Hook\UpdateHook;
use Espo\Tools\EntityManager\Params as EntityManagerParams;
use Espo\Tools\LayoutManager\LayoutManager;

/**
 * Creates attachmentCompare layout when the feature is enabled.
 */
class AttachmentCompareViewModeUpdate implements UpdateHook {
	private const LAYOUT_NAME = 'attachmentCompare';

	public function __construct(
		private readonly LayoutManager $layoutManager
	) {}

	public function process(EntityManagerParams $params, EntityManagerParams $previousParams): void {
		$entityType = $params->getName();

		$attachmentCompareViewMode = $params->get('attachmentCompareViewMode');
		$attachmentCompareViewModeField = $params->get('attachmentCompareViewModeField');

		$previousAttachmentCompareViewMode = $previousParams->get('attachmentCompareViewMode');

		// Only create layout if feature was just enabled
		if (!$attachmentCompareViewMode || !$attachmentCompareViewModeField) {
			return;
		}

		// Skip if already was enabled before (layout already exists)
		if ($previousAttachmentCompareViewMode) {
			return;
		}

		// Check if attachmentCompare layout already exists
		$existingLayout = $this->layoutManager->get($entityType, self::LAYOUT_NAME);

		if ($existingLayout !== null) {
			// Layout already exists, don't overwrite
			return;
		}

		// Get detail layout to copy from (attachmentCompare is a detail-type layout)
		$detailLayoutJson = $this->layoutManager->get($entityType, 'detail');

		if ($detailLayoutJson === null) {
			// No detail layout exists, create default
			$this->createDefaultLayout($entityType);

			return;
		}

		// Decode, then set as attachmentCompare layout
		$detailLayout = Json::decode($detailLayoutJson);

		$this->layoutManager->set($detailLayout, $entityType, self::LAYOUT_NAME);
		$this->layoutManager->save();
	}

	private function createDefaultLayout(string $entityType): void {
		$defaultLayout = [
			[
				'rows' => [
					[
						['name' => 'name']
					]
				]
			]
		];

		$this->layoutManager->set($defaultLayout, $entityType, self::LAYOUT_NAME);
		$this->layoutManager->save();
	}
}
