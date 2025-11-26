<?php

namespace Espo\Modules\Viacrm\Core\Field\PhoneNumber;

use Espo\Core\Field\PhoneNumberGroup;
use InvalidArgumentException;
use stdClass;

class PhoneNumberGroupAttributeExtractor extends \Espo\Core\Field\PhoneNumber\PhoneNumberGroupAttributeExtractor
{
	/**
	 * @param object $group (PhoneNumberGroup)
	 * @param string $field
	 *
	 * @return stdClass
	 */
	public function extract(object $group, string $field): stdClass
	{
		if (!$group instanceof PhoneNumberGroup) {
			throw new InvalidArgumentException();
		}

		$primaryNumber = $group->getPrimary() ? $group->getPrimary()->getNumber() : null;

		$dataList = [];

		foreach ($group->getList() as $phoneNumber) {
			$dataList[] = (object) [
				'phoneNumber' => $phoneNumber->getNumber(),
				'type' => $phoneNumber->getType(),
				'primary' => $primaryNumber && $phoneNumber->getNumber() === $primaryNumber,
				'optOut' => $phoneNumber->isOptedOut(),
				'invalid' => $phoneNumber->isInvalid(),
				'accountId' => $phoneNumber instanceof \Espo\Modules\Viacrm\Core\Field\PhoneNumber
					? $phoneNumber->getAccountId()
					: null,
			];
		}

		return (object) [
			$field => $primaryNumber,
			$field . 'Data' => $dataList,
		];
	}
}
