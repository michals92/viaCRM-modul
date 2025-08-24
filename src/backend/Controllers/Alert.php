<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Controllers\Record;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Modules\ViaCrm\Entities\Alert as AlertEntity;
use Espo\Modules\ViaCrm\Services\Alert as AlertService;

class Alert extends Record
{
    /**
     * Get active alerts for current user
     */
    public function actionUserAlerts(Request $request, Response $response): array
    {
        if (!$this->user->isAdmin() && !$this->user->isRegular()) {
            throw new Forbidden('Access denied');
        }
        
        try {
            // Simple direct query without service
            $entityManager = $this->getEntityManager();
            $userId = $this->user->getId();
            
            $alerts = $entityManager->getRepository('Alert')
                ->where([
                    'status' => 'Active',
                    'OR' => [
                        ['assignedUserId' => $userId],
                        ['isGlobal' => true]
                    ]
                ])
                ->order('createdAt', 'DESC')
                ->limit(0, 10)
                ->find();
            
            $result = [];
            foreach ($alerts as $alert) {
                $result[] = [
                    'id' => $alert->getId(),
                    'name' => $alert->get('name') ?: 'Alert',
                    'description' => $alert->get('description') ?: '',
                    'type' => $alert->get('type') ?: 'Info',
                    'priority' => $alert->get('priority') ?: 'Normal',
                    'iconClass' => $alert->get('iconClass') ?: 'fas fa-info-circle',
                    'color' => $alert->get('color') ?: '#17a2b8',
                    'dateStart' => $alert->get('dateStart'),
                    'dateEnd' => $alert->get('dateEnd'),
                    'url' => $alert->get('url'),
                    'isClosable' => (bool) $alert->get('isClosable'),
                    'isGlobal' => (bool) $alert->get('isGlobal'),
                    'autoCloseAfter' => $alert->get('autoCloseAfter')
                ];
            }
            
            return [
                'list' => $result,
                'total' => count($result)
            ];
            
        } catch (\Exception $e) {
            $GLOBALS['log']->error('ViaCRM Alert Error: ' . $e->getMessage() . ' Stack: ' . $e->getTraceAsString());
            
            return [
                'list' => [],
                'total' => 0,
                'error' => 'Failed to load alerts: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Mark alert as viewed by user
     */
    public function actionMarkViewed(Request $request, Response $response): array
    {
        $data = $request->getParsedBody();
        $alertId = $data->alertId ?? null;
        
        if (!$alertId) {
            throw new BadRequest('Alert ID is required');
        }
        
        try {
            // For now, just return success - implement tracking later
            return [
                'success' => true,
                'alertId' => $alertId
            ];
        } catch (\Exception $e) {
            $GLOBALS['log']->error('ViaCRM Alert Error marking viewed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Close/dismiss alert for user
     */
    public function actionClose(Request $request, Response $response): array
    {
        $data = $request->getParsedBody();
        $alertId = $data->alertId ?? null;
        
        if (!$alertId) {
            throw new BadRequest('Alert ID is required');
        }
        
        try {
            // For now, just return success - implement dismissal later
            return [
                'success' => true,
                'alertId' => $alertId
            ];
        } catch (\Exception $e) {
            $GLOBALS['log']->error('ViaCRM Alert Error closing alert: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Toggle alert for user (activate/deactivate)
     */
    public function actionToggle(Request $request, Response $response): array
    {
        $data = $request->getParsedBody();
        $alertId = $data->alertId ?? null;
        
        if (!$alertId) {
            throw new BadRequest('Alert ID is required');
        }
        
        try {
            // For now, just return success - implement toggle later
            return [
                'success' => true,
                'alertId' => $alertId,
                'isActive' => false
            ];
        } catch (\Exception $e) {
            $GLOBALS['log']->error('ViaCRM Alert Error toggling alert: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}