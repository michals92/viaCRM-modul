<?php

namespace Espo\Modules\Viacrm\Classes\Repositories;

use Espo\Core\Di;
use Espo\Entities\EmailAddress as EmailAddressEntity;
use Espo\ORM\Entity;
use stdClass;

class EmailAddress extends \Espo\Repositories\EmailAddress {
	use Di\ApplicationStateSetter;
	use Di\AclManagerSetter;
	use Di\ConfigSetter;

	/**
	 * @return stdClass[]
	 */
	public function getEmailAddressData(Entity $entity): array {
		if (!$entity->hasId()) {
			return [];
		}

		$dataList = [];

		$emailAddressList = $this
			->select(['name', 'lower', 'invalid', 'optOut', 'accountId', ['ee.primary', 'primary'], ['account.name', 'accountName']])
			->join(
				EmailAddressEntity::RELATION_ENTITY_EMAIL_ADDRESS,
				'ee',
				[
					'ee.emailAddressId:' => 'id',
				]
			)
			->leftJoin(
				'Account',
				'account',
				[
					'account.id:' => 'accountId',
					'account.deleted' => false
				]
			)
			->where([
				'ee.entityId' => $entity->getId(),
				'ee.entityType' => $entity->getEntityType(),
				'ee.deleted' => false,
			])
			->order('ee.primary', true)
			->find();

		foreach ($emailAddressList as $emailAddress) {
			$item = (object)[
				'emailAddress' => $emailAddress->get('name'),
				'lower' => $emailAddress->get('lower'),
				'primary' => $emailAddress->get('primary'),
				'optOut' => $emailAddress->get('optOut'),
				'invalid' => $emailAddress->get('invalid'),
				'accountId' => $emailAddress->get('accountId'),
				'accountName' => $emailAddress->get('accountName'),
			];
			$dataList[] = $item;
		}

		return $dataList;
	}

	/**
	 * @param string[] $order
	 */
	public function getEntityByAddress(string $address, ?string $entityType = null, ?array $order = null): ?Entity {
		return parent::getEntityByAddress($address, $entityType, $order);
	}

}
