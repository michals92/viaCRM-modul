<?php

namespace Espo\Modules\Viacrm\Classes\FieldProcessing\PhoneNumber;

use Espo\Core\ApplicationState;
use Espo\Core\FieldProcessing\PhoneNumber\AccessChecker;
use Espo\Core\FieldProcessing\Saver\Params as SaverParams;
use Espo\Core\ORM\EntityManager;
use Espo\Core\ORM\Type\FieldType;
use Espo\Core\Utils\Metadata;
use Espo\Entities\PhoneNumber;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Entity;
use Espo\ORM\Mapper\BaseMapper;
use Espo\Repositories\PhoneNumber as PhoneNumberRepository;
use ReflectionException;

class Saver extends \Espo\Core\FieldProcessing\PhoneNumber\Saver {

	private const ATTR_PHONE_NUMBER = 'phoneNumber';
	private const ATTR_PHONE_NUMBER_DATA = 'phoneNumberData';
	private const ATTR_PHONE_NUMBER_IS_OPTED_OUT = 'phoneNumberIsOptedOut';
	private const ATTR_PHONE_NUMBER_IS_INVALID = 'phoneNumberIsInvalid';

	public function __construct(
		private EntityManager $entityManager,
		ApplicationState $applicationState,
		readonly AccessChecker $accessChecker,
		readonly Metadata $metadata,
	) {
		parent::__construct(
			$entityManager,
			$applicationState,
			$accessChecker,
			$metadata
		);
	}

	/**
	 * @throws ReflectionException
	 */
	public function process(Entity $entity, SaverParams $params): void {
		$entityType = $entity->getEntityType();

		$defs = $this->entityManager->getDefs()->getEntity($entityType);

		if (!$defs->hasField(self::ATTR_PHONE_NUMBER)) {
			return;
		}

		if ($defs->getField(self::ATTR_PHONE_NUMBER)->getType() !== FieldType::PHONE) {
			return;
		}

		$phoneNumberData = null;

		if ($entity->has(self::ATTR_PHONE_NUMBER_DATA)) {
			$phoneNumberData = $entity->get(self::ATTR_PHONE_NUMBER_DATA);
		}

		if (!empty($phoneNumberData) && $entity->isAttributeChanged(self::ATTR_PHONE_NUMBER_DATA)) {
			$this->storeData($entity);

			return;
		}

		if ($entity->has(self::ATTR_PHONE_NUMBER)) {
			ReflectionUtil::callClassMethod(self::class, $this, 'storePrimary', $entity);
		}
	}

	/**
	 * @throws ReflectionException
	 */
	private function storeData(Entity $entity): void {
		if (!$entity->has(self::ATTR_PHONE_NUMBER_DATA)) {
			return;
		}

		$phoneNumberValue = $entity->get(self::ATTR_PHONE_NUMBER);

		if (is_string($phoneNumberValue)) {
			$phoneNumberValue = trim($phoneNumberValue);
		}

		$phoneNumberData = $entity->get(self::ATTR_PHONE_NUMBER_DATA);

		if (!is_array($phoneNumberData)) {
			return;
		}

		$noPrimary = array_filter($phoneNumberData, static fn($item) => !empty($item->primary)) === [];

		if ($noPrimary && $phoneNumberData !== []) {
			$phoneNumberData[0]->primary = true;
		}

		$keyList = [];
		$keyPreviousList = [];
		$previousPhoneNumberData = [];

		if (!$entity->isNew()) {
			/** @var PhoneNumberRepository $repository */
			$repository = $this->entityManager->getRepository(PhoneNumber::ENTITY_TYPE);

			$previousPhoneNumberData = $repository->getPhoneNumberData($entity);
		}

		$hash = (object) [];
		$hashPrevious = (object) [];

		foreach ($phoneNumberData as $row) {
			$key = trim($row->phoneNumber);

			if (empty($key)) {
				continue;
			}

			$type = $row->type ??
			    $this->metadata
			    ->get(['entityDefs', $entity->getEntityType(), 'fields', 'phoneNumber', 'defaultType']);

			$hash->$key = [
			    'primary' => !empty($row->primary),
			    'type' => $type,
			    'optOut' => !empty($row->optOut),
			    'invalid' => !empty($row->invalid),
			    'accountId' => $row->accountId ?? null
			];

			$keyList[] = $key;
		}

		if (
			$entity->has(self::ATTR_PHONE_NUMBER_IS_OPTED_OUT) && (
				$entity->isNew() ||
				(
					$entity->hasFetched(self::ATTR_PHONE_NUMBER_IS_OPTED_OUT) &&
					$entity->isAttributeChanged(self::ATTR_PHONE_NUMBER_IS_OPTED_OUT)
				)
			) &&
			$phoneNumberValue
		) {
			$key = $phoneNumberValue;

			if (isset($hash->$key)) {
				$hash->{$key}['optOut'] = (bool) $entity->get(self::ATTR_PHONE_NUMBER_IS_OPTED_OUT);
			}
		}

		if (
			$entity->has(self::ATTR_PHONE_NUMBER_IS_INVALID) && (
				$entity->isNew() ||
				(
					$entity->hasFetched(self::ATTR_PHONE_NUMBER_IS_INVALID) &&
					$entity->isAttributeChanged(self::ATTR_PHONE_NUMBER_IS_INVALID)
				)
			) &&
			$phoneNumberValue
		) {
			$key = $phoneNumberValue;

			if (isset($hash->$key)) {
				$hash->{$key}['invalid'] = (bool) $entity->get(self::ATTR_PHONE_NUMBER_IS_INVALID);
			}
		}

		foreach ($previousPhoneNumberData as $row) {
			$key = $row->phoneNumber;

			if (empty($key)) {
				continue;
			}

			$hashPrevious->$key = [
			    'primary' => (bool) $row->primary,
			    'type' => $row->type,
			    'optOut' => (bool) $row->optOut,
			    'invalid' => (bool) $row->invalid,
			    'accountId' => $row->accountId ?? null,
			    'accountName' => $row->accountName ?? null,
			];

			$keyPreviousList[] = $key;
		}

		$primary = null;

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

				$changed =
				    $hash->{$key}['type'] !== $hashPrevious->{$key}['type'] ||
				    $hash->{$key}['optOut'] !== $hashPrevious->{$key}['optOut'] ||
				    $hash->{$key}['invalid'] !== $hashPrevious->{$key}['invalid'] ||
				    $hash->{$key}['accountId'] !== $hashPrevious->{$key}['accountId'];

				if (
					$hash->{$key}['primary'] &&
					$hash->{$key}['primary'] === $hashPrevious->{$key}['primary']
				) {
					$primary = null;
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

		foreach ($toRemoveList as $number) {
			$phoneNumber = ReflectionUtil::callClassMethod(self::class, $this, 'getByNumber', $number);

			if (!$phoneNumber) {
				continue;
			}

			$delete = $this->entityManager->getQueryBuilder()
			    ->delete()
			    ->from('EntityPhoneNumber')
			    ->where([
			        'entityId' => $entity->getId(),
			        'entityType' => $entity->getEntityType(),
			        'phoneNumberId' => $phoneNumber->getId(),
			    ])
			    ->build();

			$this->entityManager->getQueryExecutor()->execute($delete);
		}

		foreach ($toUpdateList as $number) {
			$phoneNumber = ReflectionUtil::callClassMethod(self::class, $this, 'getByNumber', $number);

			if ($phoneNumber) {
				$skipSave = ReflectionUtil::callClassMethod(self::class, $this, 'checkChangeIsForbidden', $phoneNumber, $entity);

				if (!$skipSave) {
					$phoneNumber->set([
					    'type' => $hash->{$number}['type'],
					    'optOut' => $hash->{$number}['optOut'],
					    'invalid' => $hash->{$number}['invalid'],
					    'accountId' => $hash->{$number}['accountId'],
					]);

					$this->entityManager->saveEntity($phoneNumber);
				} else {
					$revertData[$number] = [
					    'type' => $phoneNumber->get('type'),
					    'optOut' => $phoneNumber->get('optOut'),
					    'invalid' => $phoneNumber->get('invalid'),
					    'accountId' => $phoneNumber->get('accountId')
					];
				}
			}
		}

		foreach ($toCreateList as $number) {
			$phoneNumber = ReflectionUtil::callClassMethod(self::class, $this, 'getByNumber', $number);

			if (!$phoneNumber) {
				$phoneNumber = $this->entityManager->getNewEntity(PhoneNumber::ENTITY_TYPE);

				$phoneNumber->set([
				    'name' => $number,
				    'type' => $hash->{$number}['type'],
				    'optOut' => $hash->{$number}['optOut'],
				    'invalid' => $hash->{$number}['invalid'],
				    'accountId' => $hash->{$number}['accountId'],
				]);

				$this->entityManager->saveEntity($phoneNumber);
			} else {
				$skipSave = ReflectionUtil::callClassMethod(self::class, $this, 'checkChangeIsForbidden', $phoneNumber, $entity);

				if (!$skipSave) {
					if (
						$phoneNumber->get('type') != $hash->{$number}['type'] ||
						$phoneNumber->get('optOut') != $hash->{$number}['optOut'] ||
						$phoneNumber->get('invalid') != $hash->{$number}['invalid'] ||
						$phoneNumber->get('accountId') != $hash->{$number}['accountId']
					) {
						$phoneNumber->set([
						    'type' => $hash->{$number}['type'],
						    'optOut' => $hash->{$number}['optOut'],
						    'invalid' => $hash->{$number}['invalid'],
						    'accountId' => $hash->{$number}['accountId'],
						]);

						$this->entityManager->saveEntity($phoneNumber);
					}
				} else {
					$revertData[$number] = [
					    'type' => $phoneNumber->getType(),
					    'optOut' => $phoneNumber->isOptedOut(),
					    'invalid' => $phoneNumber->isInvalid(),
					    'accountId' => $phoneNumber->get('accountId'),
					];
				}
			}

			$entityPhoneNumber = $this->entityManager->getNewEntity('EntityPhoneNumber');

			$entityPhoneNumber->set([
			    'entityId' => $entity->getId(),
			    'entityType' => $entity->getEntityType(),
			    'phoneNumberId' => $phoneNumber->getId(),
			    'primary' => $number === $primary,
			    'deleted' => false,
			    'accountId' => $hash->{$number}['accountId'],
			]);

			/** @var BaseMapper $mapper */
			$mapper = $this->entityManager->getMapper();

			$mapper->insertOnDuplicateUpdate($entityPhoneNumber, [
			    'primary',
			    'deleted',
			    'accountId'
			]);
		}

		if ($primary) {
			$phoneNumber = ReflectionUtil::callClassMethod(self::class, $this, 'getByNumber', $primary);

			$entity->set(self::ATTR_PHONE_NUMBER, $primary);

			if ($phoneNumber) {
				$update1 = $this->entityManager
				    ->getQueryBuilder()
				    ->update()
				    ->in('EntityPhoneNumber')
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
				    ->in('EntityPhoneNumber')
				    ->set(['primary' => true])
				    ->where([
				        'entityId' => $entity->getId(),
				        'entityType' => $entity->getEntityType(),
				        'phoneNumberId' => $phoneNumber->getId(),
				        'deleted' => false,
				    ])
				    ->build();

				$this->entityManager->getQueryExecutor()->execute($update2);
			}
		}

		if (!empty($revertData)) {
			foreach ($phoneNumberData as $row) {
				if (empty($revertData[$row->phoneNumber])) {
					continue;
				}

				$row->type = $revertData[$row->phoneNumber]['type'];
				$row->optOut = $revertData[$row->phoneNumber]['optOut'];
				$row->invalid = $revertData[$row->phoneNumber]['invalid'];
				$row->accountId = $revertData[$row->phoneNumber]['accountId'];
			}

			$entity->set(self::ATTR_PHONE_NUMBER_DATA, $phoneNumberData);
		}
	}

}
