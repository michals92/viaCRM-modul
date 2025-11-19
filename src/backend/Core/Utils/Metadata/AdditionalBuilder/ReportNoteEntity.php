<?php

namespace Espo\Modules\Autocrm\Core\Utils\Metadata\AdditionalBuilder;

use Espo\Core\Utils\Metadata\AdditionalBuilder;
use stdClass;

/**
 * Removes Note from Report's entityListToIgnore to allow Notes in reports.
 */
class ReportNoteEntity implements AdditionalBuilder {

	public function build(stdClass $data): void {
		// Initialize entityDefs if not exists
		$data->entityDefs = $data->entityDefs ?? (object)[];
		$data->entityDefs->Report = $data->entityDefs->Report ?? (object)[];

		// Remove 'Note' from entityListToIgnore
		if (isset($data->entityDefs->Report->entityListToIgnore)) {
			$entityListToIgnore = $data->entityDefs->Report->entityListToIgnore;

			// Only process if it's an array
			if (is_array($entityListToIgnore)) {
				// Remove 'Note' from the list
				$data->entityDefs->Report->entityListToIgnore = array_values(
					array_filter($entityListToIgnore, fn($entity) => $entity !== 'Note')
				);
			}
		}

		// Add 'Note' to entityListAllowed
		if (isset($data->entityDefs->Report->entityListAllowed)) {
			$entityListAllowed = $data->entityDefs->Report->entityListAllowed;

			// Only process if it's an array and Note is not already in the list
			if (is_array($entityListAllowed) && !in_array('Note', $entityListAllowed, true)) {
				$data->entityDefs->Report->entityListAllowed[] = 'Note';
			}
		} else {
			// Initialize entityListAllowed with Note if it doesn't exist
			$data->entityDefs->Report->entityListAllowed = ['Note'];
		}
	}

}
