<?php

namespace Espo\Modules\Viacrm\Core\Field\EmailAddress;

use Espo\Core\Field\EmailAddressGroup;
use InvalidArgumentException;
use stdClass;

class EmailAddressGroupAttributeExtractor extends \Espo\Core\Field\EmailAddress\EmailAddressGroupAttributeExtractor {
	/**
	 * @param  object   $group (EmailAddressGroup)
	 * @param  string   $field
	 * @return stdClass
	 */
	public function extract(object $group, string $field): stdClass {
		if (!$group instanceof EmailAddressGroup) {
			throw new InvalidArgumentException();
		}

		$primaryAddress = $group->getPrimary() ? $group->getPrimary()->getAddress() : null;

		$dataList = [];

		foreach ($group->getList() as $emailAddress) {
			$dataList[] = (object) [
				'emailAddress' => $emailAddress->getAddress(),
				'lower' => strtolower($emailAddress->getAddress()),
				'primary' => $primaryAddress && $emailAddress->getAddress() === $primaryAddress,
				'optOut' => $emailAddress->isOptedOut(),
				'invalid' => $emailAddress->isInvalid(),
				'accountId' => $emailAddress instanceof \Espo\Modules\Viacrm\Core\Field\EmailAddress
					? $emailAddress->getAccountId()
					: null,
			];
		}

		return (object) [
			$field => $primaryAddress,
			$field . 'Data' => $dataList,
		];
	}
}
