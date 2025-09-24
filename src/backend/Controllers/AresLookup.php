<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Templates\Controllers\Base;
use Espo\Core\Api\Request;
use Espo\Modules\ViaCrm\Services\AresLookup as AresLookupService;

class AresLookup extends Base
{
    public function getActionSearchByIco(Request $request)
    {
        try {
            $ico = $request->getQueryParam('ico') ?? '';
            
            if (empty($ico)) {
                return ['error' => 'IČO is required'];
            }

            $service = new AresLookupService();
            $result = $service->searchByIco($ico);
            
            return $result ? ['company' => $result] : ['company' => null];
        } catch (\Exception $e) {
            $GLOBALS['log']->error('AresLookup searchByIco error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }
    
    public function getActionSearchByName(Request $request)
    {
        $name = $request->getQueryParam('name') ?? '';
        
        if (empty($name)) {
            return ['companies' => []];
        }

        $service = new AresLookupService();
        $results = $service->searchByName($name);
        
        return ['companies' => $results];
    }
}