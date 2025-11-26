<?php

namespace Espo\Modules\Viacrm\Core\Field;

use Espo\Core\ORM\Entity;
use ReflectionProperty;

class EmailAddress extends \Espo\Core\Field\EmailAddress {
	private ?string $accountId = null;

	/**
	 * Clone with linked account.
	 */
	public function withAccount(?Entity $account): self {
		$obj = $this->clone();

		$obj->accountId = $account?->getId();

		return $obj;
	}

	/**
	 * Get linked account ID.
	 */
	public function getAccountId(): ?string {
		return $this->accountId;
	}

	private function clone(): self {
		$obj = new self($this->getAddress());

		// Get reflection properties
		$isInvalidProp = new ReflectionProperty(self::class, 'isInvalid');
		$isOptedOutProp = new ReflectionProperty(self::class, 'isOptedOut');

		// Get values from current instance
		$isInvalid = $isInvalidProp->getValue($this);
		$isOptedOut = $isOptedOutProp->getValue($this);

		// Set values in new instance
		$isInvalidProp->setValue($obj, $isInvalid);
		$isOptedOutProp->setValue($obj, $isOptedOut);

		$obj->accountId = $this->accountId;

		return $obj;
	}
}
