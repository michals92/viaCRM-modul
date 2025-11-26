<?php

namespace Espo\Modules\Viacrm\Entities;

use stdClass;

class WorkQueue extends \Espo\Core\Templates\Entities\Base {
	public const string TEMPLATE_TYPE = 'Base';

	public const string ENTITY_TYPE = 'WorkQueue';

	public function getValueMap(): stdClass {
		$map = [];

		if ($this->hasId()) {
			$map['id'] = $this->getId();
		}

		foreach ($this->getAttributeList() as $attribute) {
			if ($attribute === 'id') {
				continue;
			}

			$map[$attribute] = $this->get($attribute);
		}

		return (object) $map;
	}
}
