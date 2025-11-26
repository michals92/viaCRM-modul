<?php

namespace Espo\Modules\Viacrm\Core\Email;

class ReadParams extends \Espo\Core\Record\ReadParams {
	private ?string $readType = null;

	public static function create(): self {
		return new self();
	}

	public function getReadType(): ?string {
		return $this->readType;
	}

	public function setReadType(?string $readType): self {
		$this->readType = $readType;

		return $this;
	}
}
