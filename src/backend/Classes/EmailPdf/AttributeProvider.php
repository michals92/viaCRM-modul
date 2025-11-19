<?php

namespace Espo\Modules\Autocrm\Classes\EmailPdf;

use stdClass;

interface AttributeProvider {

	public function getAttributes(string $entityType, string $id, string $templateId): stdClass;

}
