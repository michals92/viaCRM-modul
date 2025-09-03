<?php

namespace Espo\Modules\ViaCrm\Hooks\Attendance;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;
use Espo\Core\Di;

class AutoFillFields implements 
    BeforeSave,
    Di\EntityManagerAware,
    Di\LogAware
{
    use Di\EntityManagerSetter;
    use Di\LogSetter;

    public static int $order = 5;

    public function beforeSave(Entity $entity, SaveOptions $options): void
    {
        $this->log->debug('AutoFillFields: beforeSave called for Attendance ' . ($entity->getId() ?? 'new'));
        
        // Set default values for new entities
        if ($entity->isNew()) {
            $this->setDefaultValues($entity);
        }
        
        // Auto-generate name from user and arrival date
        $this->generateName($entity);
        
        // Calculate working hours
        $this->calculateWorkingHours($entity);
    }
    
    private function setDefaultValues(Entity $entity): void
    {
        // Set current user as default if not set
        if (!$entity->get('userId')) {
            $currentUser = $this->entityManager->getUser();
            if ($currentUser) {
                $entity->set('userId', $currentUser->getId());
                $this->log->debug('AutoFillFields: Set default user: ' . $currentUser->get('name'));
            }
        }
        
        // Set current datetime as arrival date if not set
        if (!$entity->get('arrivalDate')) {
            $now = date('Y-m-d H:i:s');
            $entity->set('arrivalDate', $now);
            $this->log->debug('AutoFillFields: Set default arrival date: ' . $now);
        }
    }
    
    private function generateName(Entity $entity): void
    {
        $userId = $entity->get('userId');
        $arrivalDate = $entity->get('arrivalDate');
        
        if (!$userId || !$arrivalDate) {
            $this->log->debug('AutoFillFields: Cannot generate name - missing user or arrival date');
            return;
        }
        
        // Get user entity
        $user = $this->entityManager->getEntityById('User', $userId);
        if (!$user) {
            $this->log->debug('AutoFillFields: User not found: ' . $userId);
            return;
        }
        
        $userName = $user->get('name');
        $dateString = date('Y-m-d', strtotime($arrivalDate));
        
        $generatedName = $userName . ' - ' . $dateString;
        $entity->set('name', $generatedName);
        
        $this->log->debug('AutoFillFields: Generated name: ' . $generatedName);
    }
    
    private function calculateWorkingHours(Entity $entity): void
    {
        $arrivalDate = $entity->get('arrivalDate');
        $departureDate = $entity->get('departureDate');
        
        if (!$arrivalDate || !$departureDate) {
            $entity->set('workingHours', null);
            $this->log->debug('AutoFillFields: Cannot calculate working hours - missing arrival or departure date');
            return;
        }
        
        $arrival = new \DateTime($arrivalDate);
        $departure = new \DateTime($departureDate);
        
        if ($departure <= $arrival) {
            $entity->set('workingHours', 0);
            $this->log->debug('AutoFillFields: Invalid time range - departure before or same as arrival');
            return;
        }
        
        $diffInSeconds = $departure->getTimestamp() - $arrival->getTimestamp();
        $workingHours = $diffInSeconds / 3600; // Convert to hours
        
        $entity->set('workingHours', round($workingHours, 2));
        
        $this->log->debug('AutoFillFields: Calculated working hours: ' . $workingHours . ' (from ' . $arrivalDate . ' to ' . $departureDate . ')');
    }
}