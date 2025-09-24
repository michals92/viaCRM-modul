<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Templates\Controllers\Base;
use Espo\Core\Api\Request;

class AresLookup extends Base
{
    public function getActionSearchByIco(Request $request)
    {
        $ico = $request->getQueryParam('ico') ?? '';
        
        if (empty($ico)) {
            return ['error' => 'IČO is required'];
        }

        $service = $this->getServiceFactory()->create('AresLookup');
        $result = $service->searchByIco($ico);
        
        return $result ? ['company' => $result] : ['company' => null];
    }
    
    public function getActionSearchByName(Request $request)
    {
        $name = $request->getQueryParam('name') ?? '';
        
        if (empty($name)) {
            return ['companies' => []];
        }

        $service = $this->getServiceFactory()->create('AresLookup');
        $results = $service->searchByName($name);
        
        return ['companies' => $results];
    }
}