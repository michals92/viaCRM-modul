<?php

namespace Espo\Modules\Autocrm\Tools\Xml\Data;

use Espo\ORM\Entity;
use Espo\Tools\Pdf\Params as PdfParams;
use stdClass;

interface DataLoader {

	public function load(Entity $entity, PdfParams $params): stdClass;

}
