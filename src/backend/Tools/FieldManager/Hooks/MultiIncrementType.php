<?php

namespace Espo\Modules\Viacrm\Tools\FieldManager\Hooks;

use Espo\Core\Di;
use Espo\Entities\NextNumber;

class MultiIncrementType implements Di\EntityManagerAware {
	use Di\EntityManagerSetter;

	/**
	 * @param array<string, mixed> $defs
	 * @param array<string, mixed> $options
	 */
	public function onRead(string $scope, string $name, &$defs, $options): void {
		$numbers = $this->entityManager
			->getRDBRepository(NextNumber::ENTITY_TYPE)
			->where([
				'entityType' => $scope,
				'fieldName' => $name,
				'sequence!=' => null,
			])
			->find();

		$defs['sequences'] ??= [];

		foreach ($numbers as $number) {
			$defs['sequences'][$number->get('sequence')] ??= (object) [];
			$defs['sequences'][$number->get('sequence')]->nextNumber = $number->get('value');
		}
	}

	/**
	 * @param array<string, mixed> $defs
	 * @param array<string, mixed> $options
	 */
	public function afterSave(string $scope, string $name, array $defs, array $options): void {
		if (!isset($defs['sequences']) || !is_array($defs['sequences'])) {
			return;
		}

		foreach ($defs['sequences'] as $sequenceIndex => $sequence) {
			// Fetch the existing NextNumber entity for this sequence
			$nextNumber = $this->entityManager
				->getRDBRepository(NextNumber::ENTITY_TYPE)
				->where([
					'entityType' => $scope,
					'fieldName' => $name,
					'sequence' => $sequenceIndex,
				])
				->findOne();

			// If no NextNumber entity exists, create a new one
			if (!$nextNumber) {
				$nextNumber = $this->entityManager->getNewEntity(NextNumber::ENTITY_TYPE);
				$nextNumber->set('entityType', $scope);
				$nextNumber->set('fieldName', $name);
				$nextNumber->set('sequence', $sequenceIndex);
			}

			// Update the NextNumber value if it has been provided
			if (isset($sequence->nextNumber)) {
				$nextNumber->set('value', $sequence->nextNumber);
			}

			// Save the NextNumber entity
			$this->entityManager->saveEntity($nextNumber);
		}
	}
}
