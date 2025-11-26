<?php

namespace Espo\Modules\ViaCrm\Services;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Templates\Services\Base;

class Hr extends Base
{
	public function createFromUser(string $userId): \stdClass
	{
		$user = $this->getEntityManager()->getEntity('User', $userId);

		if (!$user) {
			throw new BadRequest('User not found');
		}

		// Zkontroluj zda už HR záznam existuje
		$existingHr = $this->getEntityManager()
			->getRepository('Hr')
			->where([
				'email' => $user->get('emailAddress'),
				'deleted' => false,
			])
			->findOne();

		if ($existingHr) {
			throw new BadRequest('HR record already exists for this user');
		}

		// Vytvoř nový HR záznam
		$hrData = [
			'name' => $user->get('name') ?: trim(($user->get('firstName') ?? '') . ' ' . ($user->get('lastName') ?? '')),
			'firstName' => $user->get('firstName'),
			'lastName' => $user->get('lastName'),
			'email' => $user->get('emailAddress'),
			'phone' => $user->get('phoneNumber'),
			'status' => 'Active',
			'assignedUserId' => $userId,
		];

		$hrEntity = $this->getRepository()->create((object) $hrData);

		return $hrEntity;
	}

	/**
	 * Recalculate vacation hours for a specific HR record.
	 */
	public function recalculateVacationHours(string $hrRecordId): void
	{
		$entityManager = $this->getEntityManager();

		// Get HR record
		$hrRecord = $entityManager->getEntityById('Hr', $hrRecordId);
		if (!$hrRecord) {
			throw new BadRequest('HR record not found');
		}

		// Calculate total used vacation hours from approved absences
		$totalUsedHours = $entityManager
			->getRDBRepository('Absence')
			->where([
				'hrRecordId' => $hrRecordId,
				'status' => 'approved',
				'type' => 'vacation',
				'deleted' => false,
			])
			->select(['hours'])
			->find()
			->toArray();

		$usedHours = 0;
		foreach ($totalUsedHours as $absence) {
			$hours = $absence->get('hours');
			if ($hours === null || $hours === '') {
				$hours = 8; // Default to 8 hours if not set
			}
			$usedHours += (float) $hours;
		}

		// Update HR record
		$hrRecord->set('vacationHoursUsed', $usedHours);

		// Save with hooks to calculate remaining hours
		$entityManager->saveEntity($hrRecord, [
			'skipHooks' => false,
			'silent' => false,
		]);
	}

	/**
	 * Recalculate vacation hours for all HR records.
	 */
	public function recalculateAllVacationHours(): void
	{
		$hrRecords = $this->getRepository()
			->where(['deleted' => false])
			->find();

		foreach ($hrRecords as $hrRecord) {
			$this->recalculateVacationHours($hrRecord->getId());
		}
	}
}
