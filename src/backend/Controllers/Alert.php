<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;

class Alert extends \Espo\Core\Templates\Controllers\Base 
{
    public function actionCreateSample(Request $request, Response $response): array
    {
        if (!$this->user->isAdmin()) {
            throw new \Espo\Core\Exceptions\Forbidden('Admin access required');
        }
        
        try {
            $entityManager = $this->getEntityManager();
            
            // Create sample alert
            $alert = $entityManager->createEntity('Alert', [
                'name' => 'Sample Alert - ' . date('Y-m-d H:i:s'),
                'description' => 'This is a test alert created by ViaCRM module',
                'type' => 'Info',
                'priority' => 'Normal',
                'status' => 'Active',
                'isGlobal' => true,
                'isClosable' => true
            ]);
            
            return [
                'success' => true,
                'id' => $alert->getId(),
                'name' => $alert->get('name')
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}