<?php

namespace Espo\Modules\Viacrm\Classes\Repositories;

use Espo\Core\Di;
use Espo\Entities\PhoneNumber as PhoneNumberEntity;
use Espo\ORM\Entity;
use stdClass;

class PhoneNumber extends \Espo\Repositories\PhoneNumber
{
	use Di\ApplicationStateSetter;
	use Di\AclManagerSetter;
	use Di\ConfigSetter;

	/**
	 * @return array<int, stdClass>
	 */
	public function getPhoneNumberData(Entity $entity): array
	{
		if (!$entity->hasId()) {
			return [];
		}

		$dataList = [];

		$numberList = $this
			->select(['name', 'type', 'invalid', 'optOut', 'accountId', ['en.primary', 'primary'], ['account.name', 'accountName']])
			->join(
				PhoneNumberEntity::RELATION_ENTITY_PHONE_NUMBER,
				'en',
				[
					'en.phoneNumberId:' => 'id',
				]
			)
			->leftJoin(
				'Account',
				'account',
				[
					'account.id:' => 'accountId',
					'account.deleted' => false,
				]
			)
			->where([
				'en.entityId' => $entity->getId(),
				'en.entityType' => $entity->getEntityType(),
				'en.deleted' => false,
			])
			->order('en.primary', true)
			->find();

		foreach ($numberList as $number) {
			$item = (object) [
				'phoneNumber' => $number->get('name'),
				'type' => $number->get('type'),
				'primary' => $number->get('primary'),
				'optOut' => $number->get('optOut'),
				'invalid' => $number->get('invalid'),
				'accountId' => $number->get('accountId'),
				'accountName' => $number->get('accountName'),
			];

			$dataList[] = $item;
		}

		return $dataList;
	}
}
