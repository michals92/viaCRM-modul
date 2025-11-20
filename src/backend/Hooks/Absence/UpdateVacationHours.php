<?php

namespace Espo\Modules\ViaCrm\Hooks\Absence;

use Espo\Core\Hook\Hook\AfterSave;
use Espo\Core\Hook\Hook\AfterRemove;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;
use Espo\ORM\Repository\Option\RemoveOptions;
use Espo\Core\Di;
use Espo\Core\Utils\Log;

class UpdateVacationHours implements 
    AfterSave,
    AfterRemove,
    Di\EntityManagerAware,
    Di\LogAware
{
    use Di\EntityManagerSetter;
    use Di\LogSetter;

    public static int $order = 10;

    public function afterSave(Entity $entity, SaveOptions $options): void
    {
        $this->log->debug('UpdateVacationHours: afterSave called for Absence ' . $entity->getId());
        
        // Only process vacation type absences
        if ($entity->get('type') !== 'vacation') {
            $this->log->debug('UpdateVacationHours: Not a vacation type, skipping');
            return;
        }

        $hrRecordId = $entity->get('hrRecordId');
        if (!$hrRecordId) {
            $this->log->debug('UpdateVacationHours: No hrRecordId, skipping');
            return;
        }

        // Set default hours if not set
        if (!$entity->has('hours') || $entity->get('hours') === null) {
            $entity->set('hours', 8);
            $this->log->debug('UpdateVacationHours: Set default hours to 8');
        }

        $currentStatus = $entity->get('status');
        $previousStatus = $entity->isNew() ? null : $entity->getFetched('status');
        
        $this->log->debug('UpdateVacationHours: Status change from ' . ($previousStatus ?? 'new') . ' to ' . $currentStatus);
        
        // Check if we need to update HR record
        $needsUpdate = false;
        
        if ($entity->isNew() && $currentStatus === 'approved') {
            // New approved absence
            $needsUpdate = true;
        } elseif (!$entity->isNew()) {
            if ($currentStatus !== $previousStatus) {
                // Status changed
                if ($currentStatus === 'approved' || $previousStatus === 'approved') {
                    $needsUpdate = true;
                }
            } elseif ($currentStatus === 'approved') {
                // Check if hours changed for approved absences
                $currentHours = (float)($entity->get('hours') ?? 8);
                $previousHours = (float)($entity->getFetched('hours') ?? 8);
                
                if ($currentHours !== $previousHours) {
                    $this->log->debug('UpdateVacationHours: Hours changed from ' . $previousHours . ' to ' . $currentHours);
                    $needsUpdate = true;
                }
            }
        }
        
        if ($needsUpdate) {
            $this->log->debug('UpdateVacationHours: Updating HR record ' . $hrRecordId);
            $this->updateHrVacationHours($hrRecordId);
        }
    }

    public function afterRemove(Entity $entity, RemoveOptions $options): void
    {
        $this->log->debug('UpdateVacationHours: afterRemove called for Absence ' . $entity->getId());
        
        // Only process approved vacation type absences
        if ($entity->get('type') !== 'vacation' || $entity->get('status') !== 'approved') {
            return;
        }

        $hrRecordId = $entity->get('hrRecordId');
        if (!$hrRecordId) {
            return;
        }

        $this->updateHrVacationHours($hrRecordId);
    }

    private function updateHrVacationHours(string $hrRecordId): void
    {
        try {
            $entityManager = $this->entityManager;
            
            // Get HR record
            $hrRecord = $entityManager->getEntityById('Hr', $hrRecordId);
            if (!$hrRecord) {
                $this->log->warning('UpdateVacationHours: HR record not found: ' . $hrRecordId);
                return;
            }

            // Calculate total used vacation hours from approved absences
            $absenceRepository = $entityManager->getRDBRepository('Absence');
            
            $query = $absenceRepository
                ->where([
                    'hrRecordId' => $hrRecordId,
                    'status' => 'approved',
                    'type' => 'vacation',
                    'deleted' => false
                ])
                ->select(['id', 'hours', 'startDate', 'endDate']);
            
            $absences = $query->find();
            
            $this->log->debug('UpdateVacationHours: Found ' . count($absences) . ' approved vacation absences');
            
            $usedHours = 0;
            foreach ($absences as $absence) {
                $hours = $absence->get('hours');
                if ($hours === null || $hours === '') {
                    $hours = 8; // Default to 8 hours if not set
                }
                $usedHours += (float)$hours;
                $this->log->debug('UpdateVacationHours: Absence ' . $absence->getId() . ' has ' . $hours . ' hours');
            }

            $this->log->debug('UpdateVacationHours: Total used hours: ' . $usedHours);
            
            // Update HR record
            $oldUsedHours = $hrRecord->get('vacationHoursUsed');
            $hrRecord->set('vacationHoursUsed', $usedHours);
            
            $total = $hrRecord->get('vacationHoursTotal') ?? 0;
            $remaining = max(0, $total - $usedHours);
            $hrRecord->set('vacationHoursRemaining', $remaining);
            
            $this->log->debug('UpdateVacationHours: Updating HR record - used: ' . $usedHours . ', remaining: ' . $remaining);
            
            // Save HR record
            $entityManager->saveEntity($hrRecord, [
                'skipHooks' => false,
                'silent' => false
            ]);
            
            $this->log->debug('UpdateVacationHours: HR record updated successfully');
            
        } catch (\Exception $e) {
            $this->log->error('UpdateVacationHours: Error updating HR vacation hours: ' . $e->getMessage());
        }
    }
}