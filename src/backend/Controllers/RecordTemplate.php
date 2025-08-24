<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Controllers\Record;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Utils\Json;

class RecordTemplate extends Record
{
    /**
     * Get templates for specific entity type
     */
    public function getActionGetTemplatesForEntity(Request $request, Response $response): array
    {
        $entityType = $request->getRouteParam('entityType');
        
        if (!$entityType) {
            throw new BadRequest('Entity type is required');
        }
        
        if (!$this->acl->checkScope($entityType, 'read')) {
            throw new Forbidden();
        }
        
        $templates = $this->recordService->find([
            'where' => [
                [
                    'attribute' => 'entityType',
                    'type' => 'equals',
                    'value' => $entityType
                ],
                [
                    'attribute' => 'isActive',
                    'type' => 'isTrue'
                ]
            ],
            'orderBy' => [
                ['field' => 'name', 'order' => 'asc']
            ]
        ]);
        
        $result = [];
        foreach ($templates->getValueMapList() as $template) {
            $result[] = [
                'id' => $template->id,
                'name' => $template->name,
                'description' => $template->description,
                'entityType' => $template->entityType,
                'createdBy' => $template->createdBy,
                'createdAt' => $template->createdAt
            ];
        }
        
        return [
            'list' => $result,
            'total' => count($result)
        ];
    }
    
    /**
     * Create record from template
     */
    public function postActionCreateFromTemplate(Request $request, Response $response): array
    {
        $data = $request->getParsedBody();
        
        $templateId = $data->templateId ?? null;
        $entityType = $data->entityType ?? null;
        
        if (!$templateId || !$entityType) {
            throw new BadRequest('Template ID and entity type are required');
        }
        
        if (!$this->acl->checkScope($entityType, 'create')) {
            throw new Forbidden('No create access for ' . $entityType);
        }
        
        $template = $this->recordService->getEntity($templateId);
        
        if (!$template) {
            throw new NotFound('Template not found');
        }
        
        if ($template->get('entityType') !== $entityType) {
            throw new BadRequest('Template entity type mismatch');
        }
        
        // Get template data
        $templateData = Json::decode($template->get('data') ?? '{}', true);
        
        // Merge with any additional data provided
        $additionalData = $data->data ?? (object)[];
        $mergedData = array_merge($templateData, (array)$additionalData);
        
        // Create the record using appropriate service
        $targetService = $this->injectableFactory->create($entityType . 'Service');
        
        if (!$targetService) {
            throw new BadRequest('Cannot create service for entity type: ' . $entityType);
        }
        
        $createdEntity = $targetService->create((object)$mergedData, []);
        
        return [
            'id' => $createdEntity->getId(),
            'entityType' => $entityType,
            'templateUsed' => $template->get('name')
        ];
    }
    
    /**
     * Save current record as template
     */
    public function postActionSaveAsTemplate(Request $request, Response $response): array
    {
        $data = $request->getParsedBody();
        
        $sourceId = $data->sourceId ?? null;
        $entityType = $data->entityType ?? null;
        $templateName = $data->templateName ?? null;
        
        if (!$sourceId || !$entityType || !$templateName) {
            throw new BadRequest('Source ID, entity type, and template name are required');
        }
        
        if (!$this->acl->checkScope($entityType, 'read')) {
            throw new Forbidden('No read access for ' . $entityType);
        }
        
        // Get source record
        $sourceService = $this->injectableFactory->create($entityType . 'Service');
        
        if (!$sourceService) {
            throw new BadRequest('Cannot create service for entity type: ' . $entityType);
        }
        
        $sourceEntity = $sourceService->getEntity($sourceId);
        
        if (!$sourceEntity) {
            throw new NotFound('Source record not found');
        }
        
        // Extract data for template (exclude system fields)
        $excludeFields = [
            'id', 'createdAt', 'modifiedAt', 'createdById', 'modifiedById',
            'createdByName', 'modifiedByName', 'deleted'
        ];
        
        $templateData = [];
        $sourceData = $sourceEntity->getValueMap();
        
        foreach ($sourceData as $field => $value) {
            if (!in_array($field, $excludeFields) && $value !== null) {
                $templateData[$field] = $value;
            }
        }
        
        // Create template
        $templateEntity = $this->recordService->create((object)[
            'name' => $templateName,
            'entityType' => $entityType,
            'description' => $data->description ?? 'Template created from ' . $entityType,
            'data' => Json::encode($templateData),
            'isActive' => true
        ], []);
        
        return [
            'id' => $templateEntity->getId(),
            'name' => $templateEntity->get('name'),
            'entityType' => $entityType
        ];
    }
}