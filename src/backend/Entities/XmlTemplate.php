<?php

namespace Espo\Modules\Autocrm\Entities;

use RuntimeException;

class XmlTemplate extends \Espo\Core\Templates\Entities\Base {

	public const ENTITY_TYPE = 'XmlTemplate';

	public function getTargetEntityType(): string {
		return $this->get('entityType') ?? throw new RuntimeException('XmlTemplate entity target entity type is not set');
	}

	public function getBody(): ?string {
		return $this->get('body');
	}

}
