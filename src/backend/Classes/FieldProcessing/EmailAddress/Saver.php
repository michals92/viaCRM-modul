<?php

namespace Espo\Modules\Viacrm\Classes\FieldProcessing\EmailAddress;

use Espo\Core\ApplicationState;
use Espo\Core\FieldProcessing\EmailAddress\AccessChecker;
use Espo\Core\FieldProcessing\Saver\Params as SaverParams;
use Espo\Core\ORM\EntityManager;
use Espo\Core\ORM\Type\FieldType;
use Espo\Entities\EmailAddress;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Entity;
use Espo\Repositories\EmailAddress as EmailAddressRepository;
use ReflectionException;

class Saver extends \Espo\Core\FieldProcessing\EmailAddress\Saver {

	public function __construct(
		private EntityManager $entityManager,
		ApplicationState $applicationState,
		private AccessChecker $accessChecker,
	) {
		parent::__construct(
			$entityManager,
			$applicationState,
			$this->accessChecker
		);
	}

	/**
	 * @throws ReflectionException
	 */
	public function process(Entity $entity, SaverParams $params): void {
		$entityType = $entity->getEntityType();

		$defs = $this->entityManager->getDefs()->getEntity($entityType);

		if (!$defs->hasField('emailAddress')) {
			return;
		}

		if ($defs->getField('emailAddress')->getType() !== FieldType::EMAIL) {
			return;
		}

		$emailAddressData = null;

		if ($entity->has('emailAddressData')) {
			$emailAddressData = $entity->get('emailAddressData');
		}

		if (!empty($emailAddressData) && $entity->isAttributeChanged('emailAddressData')) {
			$this->storeData($entity);

			return;
		}

		if ($entity->has('emailAddress')) {
			ReflectionUtil::callClassMethod(self::class, $this, 'storePrimary', $entity);
		}
	}

	/**
	 * @throws ReflectionException
	 */
	private function storeData(Entity $entity): void {
		if (!$entity->has('emailAddressData')) {
			return;
		}

		$emailAddressValue = $entity->get('emailAddress');

		if (is_string($emailAddressValue)) {
			$emailAddressValue = trim($emailAddressValue);
		}

		$emailAddressData = $entity->get('emailAddressData');

		if (!is_array($emailAddressData)) {
			return;
		}

		$noPrimary = array_filter($emailAddressData, fn($item) => !empty($item->primary)) === [];

		if ($noPrimary && $emailAddressData !== []) {
			$emailAddressData[0]->primary = true;
		}

		$keyList = [];
		$keyPreviousList = [];
		$previousEmailAddressData = [];

		if (!$entity->isNew()) {
			/** @var EmailAddressRepository $repository */
			$repository = $this->entityManager->getRepository(EmailAddress::ENTITY_TYPE);
			$previousEmailAddressData = $repository->getEmailAddressData($entity);
		}

		$hash = (object)[];
		$hashPrevious = (object)[];

		foreach ($emailAddressData as $row) {
			$key = trim($row->emailAddress);

			if (empty($key)) {
				continue;
			}

			$key = strtolower($key);

			$hash->$key = [
				'primary' => !empty($row->primary),
				'optOut' => !empty($row->optOut),
				'invalid' => !empty($row->invalid),
				'emailAddress' => trim($row->emailAddress),
				'accountId' => $row->accountId ?? null,
				'accountName' => $row->accountName ?? null,
			];

			$keyList[] = $key;
		}

		foreach ($previousEmailAddressData as $row) {
			$key = $row->lower;

			if (empty($key)) {
				continue;
			}

			$hashPrevious->$key = [
				'primary' => (bool)$row->primary,
				'optOut' => (bool)$row->optOut,
				'invalid' => (bool)$row->invalid,
				'emailAddress' => $row->emailAddress,
				'accountId' => $row->accountId ?? null,
				'accountName' => $row->accountName ?? null,
			];

			$keyPreviousList[] = $key;
		}

		$primary = false;

		$toCreateList = [];
		$toUpdateList = [];
		$toRemoveList = [];

		$revertData = [];

		foreach ($keyList as $key) {
			$new = true;
			$changed = false;

			if ($hash->{$key}['primary']) {
				$primary = $key;
			}

			if (property_exists($hashPrevious, $key)) {
				$new = false;

				$changed
					= $hash->{$key}['optOut'] != $hashPrevious->{$key}['optOut']
					|| $hash->{$key}['invalid'] != $hashPrevious->{$key}['invalid']
					|| $hash->{$key}['emailAddress'] !== $hashPrevious->{$key}['emailAddress']
					|| $hash->{$key}['accountId'] !== $hashPrevious->{$key}['accountId']
					|| $hash->{$key}['accountName'] !== $hashPrevious->{$key}['accountName'];

				if ($hash->{$key}['primary'] && $hash->{$key}['primary'] === $hashPrevious->{$key}['primary']) {
					$primary = false;
				}
			}

			if ($new) {
				$toCreateList[] = $key;
			}

			if ($changed) {
				$toUpdateList[] = $key;
			}
		}

		foreach ($keyPreviousList as $key) {
			if (!property_exists($hash, $key)) {
				$toRemoveList[] = $key;
			}
		}

		foreach ($toRemoveList as $address) {
			$emailAddress = ReflectionUtil::callClassMethod(self::class, $this, 'getByAddress', $address);

			if (!$emailAddress) {
				continue;
			}

			$delete = $this->entityManager
				->getQueryBuilder()
				->delete()
				->from('EntityEmailAddress')
				->where([
					'entityId' => $entity->getId(),
					'entityType' => $entity->getEntityType(),
					'emailAddressId' => $emailAddress->getId(),
				])
				->build();

			$this->entityManager->getQueryExecutor()->execute($delete);
		}

		foreach ($toUpdateList as $address) {
			$emailAddress = ReflectionUtil::callClassMethod(self::class, $this, 'getByAddress', $address);

			if ($emailAddress) {
				$skipSave = ReflectionUtil::callClassMethod(self::class, $this, 'checkChangeIsForbidden', $emailAddress, $entity);

				if (!$skipSave) {
					$emailAddress->set([
						'optOut' => $hash->{$address}['optOut'],
						'invalid' => $hash->{$address}['invalid'],
						'name' => $hash->{$address}['emailAddress'],
						'accountId' => $hash->{$address}['accountId'],
					]);

					$this->entityManager->saveEntity($emailAddress);
				} else {
					$revertData[$address] = [
						'optOut' => $emailAddress->get('optOut'),
						'invalid' => $emailAddress->get('invalid'),
						'accountId' => $emailAddress->get('accountId'),
					];
				}
			}
		}

		foreach ($toCreateList as $address) {
			$emailAddress = ReflectionUtil::callClassMethod(self::class, $this, 'getByAddress', $address);

			if (!$emailAddress) {
				$emailAddress = $this->entityManager->getNewEntity(EmailAddress::ENTITY_TYPE);

				$emailAddress->set([
					'name' => $hash->{$address}['emailAddress'],
					'optOut' => $hash->{$address}['optOut'],
					'invalid' => $hash->{$address}['invalid'],
					'accountId' => $hash->{$address}['accountId'],
				]);

				$this->entityManager->saveEntity($emailAddress);
			} else {
				$skipSave = ReflectionUtil::callClassMethod(self::class, $this, 'checkChangeIsForbidden', $emailAddress, $entity);

				if (!$skipSave) {
					if (
						$emailAddress->get('optOut') != $hash->{$address}['optOut']
						|| $emailAddress->get('invalid') != $hash->{$address}['invalid']
						|| $emailAddress->get('emailAddress') != $hash->{$address}['emailAddress']
						|| $emailAddress->get('accountId') != $hash->{$address}['accountId']
					) {
						$emailAddress->set([
							'optOut' => $hash->{$address}['optOut'],
							'invalid' => $hash->{$address}['invalid'],
							'name' => $hash->{$address}['emailAddress'],
							'accountId' => $hash->{$address}['accountId'],
						]);

						$this->entityManager->saveEntity($emailAddress);
					}
				} else {
					$revertData[$address] = [
						'optOut' => $emailAddress->get('optOut'),
						'invalid' => $emailAddress->get('invalid'),
						'accountId' => $emailAddress->get('accountId'),
					];
				}
			}

			$entityEmailAddress = $this->entityManager->getNewEntity('EntityEmailAddress');

			$entityEmailAddress->set([
				'entityId' => $entity->getId(),
				'entityType' => $entity->getEntityType(),
				'emailAddressId' => $emailAddress->getId(),
				'primary' => $address === $primary,
				'deleted' => false,
			]);

			$mapper = $this->entityManager->getMapper();

			$mapper->insertOnDuplicateUpdate($entityEmailAddress, [
				'primary',
				'deleted',
			]);
		}

		if ($primary) {
			$emailAddress = ReflectionUtil::callClassMethod(self::class, $this, 'getByAddress', $primary);

			if ($emailAddress) {
				$update1 = $this->entityManager
					->getQueryBuilder()
					->update()
					->in('EntityEmailAddress')
					->set(['primary' => false])
					->where([
						'entityId' => $entity->getId(),
						'entityType' => $entity->getEntityType(),
						'primary' => true,
						'deleted' => false,
					])
					->build();

				$this->entityManager->getQueryExecutor()->execute($update1);

				$update2 = $this->entityManager
					->getQueryBuilder()
					->update()
					->in('EntityEmailAddress')
					->set(['primary' => true])
					->where([
						'entityId' => $entity->getId(),
						'entityType' => $entity->getEntityType(),
						'emailAddressId' => $emailAddress->getId(),
						'deleted' => false,
					])
					->build();

				$this->entityManager->getQueryExecutor()->execute($update2);
			}
		}

		if (!empty($revertData)) {
			foreach ($emailAddressData as $row) {
				if (empty($revertData[$row->emailAddress])) {
					continue;
				}

				$row->optOut = $revertData[$row->emailAddress]['optOut'];
				$row->invalid = $revertData[$row->emailAddress]['invalid'];
				$row->accountId = $revertData[$row->emailAddress]['accountId'];
			}

			$entity->set('emailAddressData', $emailAddressData);
		}
	}

}
