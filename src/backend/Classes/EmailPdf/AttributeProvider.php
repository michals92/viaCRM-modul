<?php

namespace Espo\Modules\Viacrm\Classes\EmailPdf;

use stdClass;

interface AttributeProvider
{
	public function getAttributes(string $entityType, string $id, string $templateId): stdClass;
}
