<?php

declare(strict_types=1);

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Controllers\Base;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\BadRequest;

class Test extends Base
{
    public function getActionHello(Request $request, Response $response): array
    {
        return [
            'message' => 'Hello from VIA CRM module!',
            'version' => '1.0.0',
            'timestamp' => date('Y-m-d H:i:s'),
            'features' => [
                'view_extensions' => true,
                'controller_extensions' => true,
                'enhanced_views' => ['detail', 'list', 'edit'],
                'layout_manager_enhanced' => true,
                'related_fields' => true,
                'related_panels' => true
            ]
        ];
    }

    public function getActionExtensions(Request $request, Response $response): array
    {
        return [
            'view_extensions' => [
                'detail' => 'Enhanced detail views with VIA CRM features',
                'list' => 'Enhanced list views with related fields preparation',
                'edit' => 'Enhanced edit views with formula fields preparation'
            ],
            'status' => 'VIA CRM Extensions v1.0 - First Block Complete!',
            'completed_features' => [
                'view_extensions_system',
                'layout_manager_enhancements', 
                'related_fields_support',
                'related_panels_enhanced'
            ],
            'next_block_features' => [
                'editable_list_fields',
                'formula_fields',
                'alert_system',
                'custom_icons_management'
            ]
        ];
    }
}