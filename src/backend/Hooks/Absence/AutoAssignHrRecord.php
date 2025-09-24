<?php

namespace Espo\Modules\ViaCrm\Hooks\Absence;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;
use Espo\Core\Di;

class AutoAssignHrRecord implements 
    BeforeSave,
    Di\EntityManagerAware,
    Di\LogAware
{
    use Di\EntityManagerSetter;
    use Di\LogSetter;

    public static int $order = 1; // Run before CalculateHours (order 5)

    public function beforeSave(Entity $entity, SaveOptions $options): void
    {
        $requestedById = $entity->get('requestedById');
        
        // Only auto-assign if we have a requestedBy user
        if (!$requestedById) {
            $this->log->debug('AutoAssignHrRecord: No requestedById provided, skipping');
            return;
        }
        
        // Only auto-assign if HR record is not already set or if requestedBy changed
        if (!$entity->isNew() && !$entity->isAttributeChanged('requestedById') && $entity->get('hrRecordId')) {
            $this->log->debug('AutoAssignHrRecord: HR record already set and requestedBy unchanged, skipping');
            return;
        }
        
        $this->log->debug('AutoAssignHrRecord: Looking for HR record for user: ' . $requestedById);
        
        // Find HR record where assignedUserId matches requestedById
        $hrRecord = $this->entityManager
            ->getRDBRepository('Hr')
            ->where([
                'assignedUserId' => $requestedById,
                'deleted' => false
            ])
            ->findOne();
        
        if ($hrRecord) {
            $entity->set('hrRecordId', $hrRecord->getId());
            $this->log->debug('AutoAssignHrRecord: Found and assigned HR record: ' . $hrRecord->getId() . ' for user: ' . $requestedById);
        } else {
            $this->log->debug('AutoAssignHrRecord: No HR record found for user: ' . $requestedById);
            // Clear HR record if no match found
            if ($entity->get('hrRecordId')) {
                $entity->set('hrRecordId', null);
                $this->log->debug('AutoAssignHrRecord: Cleared previous HR record as no match found');
            }
        }
    }
}