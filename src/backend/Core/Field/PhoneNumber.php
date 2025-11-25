<?php

namespace Espo\Modules\Viacrm\Core\Field;

use Espo\Core\ORM\Entity;
use ReflectionProperty;

class PhoneNumber extends \Espo\Core\Field\PhoneNumber {

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
		$obj = new self($this->getNumber());

		// Get reflection properties
		$typeProp = new ReflectionProperty(self::class, 'type');
		$isInvalidProp = new ReflectionProperty(self::class, 'isInvalid');
		$isOptedOutProp = new ReflectionProperty(self::class, 'isOptedOut');

		// Get values from current instance
		$type = $typeProp->getValue($this);
		$isInvalid = $isInvalidProp->getValue($this);
		$isOptedOut = $isOptedOutProp->getValue($this);

		// Set values in new instance
		$typeProp->setValue($obj, $type);
		$isInvalidProp->setValue($obj, $isInvalid);
		$isOptedOutProp->setValue($obj, $isOptedOut);
		$obj->accountId = $this->accountId;

		return $obj;
	}

}
