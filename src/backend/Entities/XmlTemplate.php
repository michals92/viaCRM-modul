<?php

namespace Espo\Modules\Viacrm\Entities;

use RuntimeException;

class XmlTemplate extends \Espo\Core\Templates\Entities\Base {
	public const string TEMPLATE_TYPE = 'Base';

	public const string ENTITY_TYPE = 'XmlTemplate';

	public function getTargetEntityType(): string {
		return $this->get('entityType') ?? throw new RuntimeException('XmlTemplate entity target entity type is not set');
	}

	public function getBody(): ?string {
		return $this->get('body');
	}
}
