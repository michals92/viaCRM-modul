<?php

namespace Espo\Modules\Autocrm\Core\Utils\Metadata\AdditionalBuilder;

use Espo\Core\Utils\Metadata\AdditionalBuilder;
use stdClass;

/** The purpose of this class is to add 'color' and 'iconClass' fields to DocumentFolder, KnowledgeBaseCategory, and EmailTemplateCategory,
 *  but only if their entityDefs are defined.
 */
class DefaultWysiwygFieldView implements AdditionalBuilder {

	public function build(stdClass $data): void {
		$params = $data->fields->wysiwyg->params;

		foreach ($params as $i => $param) {
			if ($param->name === 'default') {
				$params[$i]->view = 'autocrm:views/admin/field-manager/fields/wysiwyg/default';
			}
		}
	}

}
