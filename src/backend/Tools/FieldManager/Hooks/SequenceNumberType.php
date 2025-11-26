<?php

namespace Espo\Modules\Viacrm\Tools\FieldManager\Hooks;

use Espo\Core\Utils\DateTime;
use Espo\Modules\Viacrm\Entities\NextSequenceNumber;
use Espo\ORM\EntityManager;

class SequenceNumberType
{
	public function __construct(
		private readonly EntityManager $entityManager
	) {
	}

	/**
	 * @param array<string,mixed> $defs
	 * @param array<string,mixed> $options
	 */
	public function onRead(string $scope, string $name, array &$defs, array $options): void
	{
		$number = $this->entityManager
			->getRDBRepository(NextSequenceNumber::ENTITY_TYPE)
			->where([
				'entityType' => $scope,
				'fieldName' => $name,
			])
			->findOne();

		$value = null;

		if (!$number) {
			$value = 1;
		} elseif (!$number->get('value')) {
			$value = 1;
		}

		if (!$value && $number) {
			$value = $number->get('value');
		}

		$defs['nextNumber'] = $value;
	}

	/**
	 * @param array<string,mixed> $defs
	 * @param array<string,mixed> $options
	 */
	public function afterSave(string $scope, string $name, $defs, $options): void
	{
		if (!isset($defs['nextNumber'])) {
			return;
		}

		$number = $this->entityManager
			->getRDBRepository(NextSequenceNumber::ENTITY_TYPE)
			->where([
				'entityType' => $scope,
				'fieldName' => $name,
			])
			->findOne();

		if (!$number) {
			$number = $this->entityManager->getNewEntity(NextSequenceNumber::ENTITY_TYPE);

			$number->set('entityType', $scope);
			$number->set('fieldName', $name);
			$number->set('date', DateTime::getSystemTodayString());
		}

		$number->set('value', $defs['nextNumber']);

		$this->entityManager->saveEntity($number);
	}

	/**
	 * @param array<string,mixed> $defs
	 * @param array<string,mixed> $options
	 */
	public function afterRemove(string $scope, string $name, $defs, $options): void
	{
		$number = $this->entityManager
			->getRDBRepository(NextSequenceNumber::ENTITY_TYPE)
			->where([
				'entityType' => $scope,
				'fieldName' => $name,
			])
			->findOne();

		if (!$number) {
			return;
		}

		$this->entityManager->removeEntity($number);
	}
}
