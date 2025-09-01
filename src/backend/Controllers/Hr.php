<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Templates\Controllers\Base;
use Espo\Core\Api\Request;
use Espo\Core\Exceptions\BadRequest;

class Hr extends Base
{
    public function postActionRecalculateVacationHours(Request $request): bool
    {
        $data = $request->getParsedBody();
        $id = $data->id ?? null;
        
        if (!$id) {
            throw new BadRequest('ID is required');
        }
        
        /** @var \Espo\Modules\ViaCrm\Services\Hr $service */
        $service = $this->getRecordService();
        
        $service->recalculateVacationHours($id);
        
        return true;
    }
    
    public function postActionRecalculateAllVacationHours(): bool
    {
        /** @var \Espo\Modules\ViaCrm\Services\Hr $service */
        $service = $this->getRecordService();
        
        $service->recalculateAllVacationHours();
        
        return true;
    }
}