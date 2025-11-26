<?php

namespace Espo\Modules\Viacrm\Tools\EmailTemplate\ViewInBrowser;

class Data {
	private ?string $emailTemplateId = null;

	private ?string $parentId = null;

	private ?string $parentType = null;

	public static function create(): self {
		return new self();
	}

	public function getEmailTemplateId(): ?string {
		return $this->emailTemplateId;
	}

	public function getParentId(): ?string {
		return $this->parentId;
	}

	public function getParentType(): ?string {
		return $this->parentType;
	}

	public function withEmailTemplateId(?string $templateId): self {
		$obj = clone $this;
		$obj->emailTemplateId = $templateId;

		return $obj;
	}

	public function withParentId(?string $parentId): self {
		$obj = clone $this;
		$obj->parentId = $parentId;

		return $obj;
	}

	public function withParentType(?string $parentType): self {
		$obj = clone $this;
		$obj->parentType = $parentType;

		return $obj;
	}

	/**
	 * @return array<string, string|null>
	 */
	public function getValueMap(): array {
		return array_filter(get_object_vars($this));
	}
}
