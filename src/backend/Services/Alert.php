<?php

namespace Espo\Modules\ViaCrm\Services;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Services\Record;
use Espo\Modules\ViaCrm\Entities\Alert as AlertEntity;
use Espo\ORM\Entity;

class Alert extends Record
{
    /**
     * Get active alerts for a specific user
     */
    public function getActiveAlertsForUser(string $userId): array
    {
        $currentDateTime = date('Y-m-d H:i:s');
        $repository = $this->entityManager->getRepository('Alert');
        
        // Simple query for active alerts
        $alerts = $repository
            ->where([
                'status' => AlertEntity::STATUS_ACTIVE,
                'OR' => [
                    ['assignedUserId' => $userId],
                    ['isGlobal' => true]
                ]
            ])
            ->order('priority', 'DESC')
            ->order('createdAt', 'DESC')
            ->limit(0, 20)
            ->find();

        $result = [];
        
        foreach ($alerts as $alert) {
            // Simple date validation
            if (!$alert->isCurrentlyValid()) {
                continue;
            }
            
            $result[] = $alert;
        }
        
        return $result;
    }
    
    /**
     * Close alert for user
     */
    public function closeAlertForUser(string $alertId, string $userId): bool
    {
        $alert = $this->entityManager->getEntity('Alert', $alertId);
        
        if (!$alert) {
            throw new NotFound('Alert not found');
        }
        
        if (!$alert->isClosable()) {
            throw new BadRequest('Alert cannot be closed');
        }
        
        if (!$this->shouldUserSeeAlert($alert, $userId)) {
            throw new Forbidden('No access to this alert');
        }
        
        // For now, just return success - later we can implement user-specific dismissal
        return true;
    }
    
    /**
     * Mark alert as viewed by user
     */
    public function markAlertViewedByUser(string $alertId, string $userId): bool
    {
        $alert = $this->entityManager->getEntity('Alert', $alertId);
        
        if (!$alert) {
            throw new NotFound('Alert not found');
        }
        
        if (!$this->shouldUserSeeAlert($alert, $userId)) {
            throw new Forbidden('No access to this alert');
        }
        
        // For now, just return success - later we can implement viewed tracking
        return true;
    }
    
    /**
     * Toggle alert for user
     */
    public function toggleAlertForUser(string $alertId, string $userId): bool
    {
        $alert = $this->entityManager->getEntity('Alert', $alertId);
        
        if (!$alert) {
            throw new NotFound('Alert not found');
        }
        
        if (!$this->shouldUserSeeAlert($alert, $userId)) {
            throw new Forbidden('No access to this alert');
        }
        
        // For now, just return current active state - later implement toggle logic
        return true;
    }
    
    /**
     * Check if user should see this alert (basic access control)
     */
    private function shouldUserSeeAlert(AlertEntity $alert, string $userId): bool
    {
        // Global alerts are visible to all users
        if ($alert->isGlobal()) {
            return true;
        }
        
        // Check if user is assigned to this alert
        if ($alert->get('assignedUserId') === $userId) {
            return true;
        }
        
        return false;
    }
}