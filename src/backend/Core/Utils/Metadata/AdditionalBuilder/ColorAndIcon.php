<?php

namespace Espo\Modules\Autocrm\Core\Utils\Metadata\AdditionalBuilder;

use Espo\Core\Utils\Metadata\AdditionalBuilder;
use stdClass;

/** The purpose of this class is to add 'color' and 'iconClass' fields to DocumentFolder, KnowledgeBaseCategory, and EmailTemplateCategory,
 *  but only if their entityDefs are defined.
 */
class ColorAndIcon implements AdditionalBuilder {

	public function build(stdClass $data): void {
		$entities = [
		    'DocumentFolder',
		    'EmailFolder',
		    'EmailTemplateCategory',
		    'GroupEmailFolder',
		    'KnowledgeBaseCategory',
		    'WorkflowCategory'
		];

		foreach ($entities as $entity) {
			if (isset($data->entityDefs->$entity)) {
				$data->entityDefs->$entity->fields->color = [
				    'type' => 'colorpicker',
				    'tooltip' => true,
				];
				$data->entityDefs->$entity->fields->iconClass = [
				    'type' => 'varchar',
				    'maxLength' => 50,
				    'tooltip' => true,
				    'view' => 'autocrm:views/fields/icon-class',
				];
			}
		}
	}

}
