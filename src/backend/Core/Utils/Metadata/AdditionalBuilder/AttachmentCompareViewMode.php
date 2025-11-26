<?php

namespace Espo\Modules\Viacrm\Core\Utils\Metadata\AdditionalBuilder;

use Espo\Core\Utils\Metadata\AdditionalBuilder as AdditionalBuilderInterface;
use stdClass;

/**
 * Adds attachmentCompare view mode to entities with the feature enabled.
 */
class AttachmentCompareViewMode implements AdditionalBuilderInterface
{
	public function build(stdClass $data): void
	{
		$data->clientDefs ??= (object) [];

		// Get all scopes
		$scopes = get_object_vars($data->scopes ?? (object) []);

		foreach ($scopes as $scope => $scopeData) {
			// Check if this scope has clientDefs
			if (!isset($data->clientDefs->$scope)) {
				continue;
			}

			$clientDefs = $data->clientDefs->$scope;

			// Check if attachmentCompare feature is enabled for this entity
			$attachmentCompareViewMode = $clientDefs->attachmentCompareViewMode ?? false;
			$attachmentCompareViewModeField = $clientDefs->attachmentCompareViewModeField ?? null;

			if (!$attachmentCompareViewMode || !$attachmentCompareViewModeField) {
				continue;
			}

			// Add 'attachmentCompare' to detailViewModeList
			$detailViewModeList = $clientDefs->detailViewModeList ?? ['detail'];

			if (!is_array($detailViewModeList)) {
				$detailViewModeList = ['detail'];
			}

			if (!in_array('attachmentCompare', $detailViewModeList)) {
				$detailViewModeList[] = 'attachmentCompare';
				$clientDefs->detailViewModeList = $detailViewModeList;
			}

			// Add recordView for attachmentCompare mode
			$clientDefs->recordViews ??= (object) [];
			$clientDefs->recordViews->attachmentCompare = 'viacrm:views/record/attachment-compare';

			// Add additional layout for attachmentCompare
			$clientDefs->additionalLayouts ??= (object) [];
			$clientDefs->additionalLayouts->attachmentCompare = (object) [
				'type' => 'detail',
			];
		}
	}
}
