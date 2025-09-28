<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Controllers\Record;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;

class Report extends Record
{
    public function actionRun(Request $request, Response $response): void
    {
        $id = $request->getRouteParam('id');
        if (!$id) {
            throw new BadRequest('Report ID is required');
        }

        $reportService = $this->getRecordService();
        $result = $reportService->runReport($id);
        
        $response->setHeader('Content-Type', 'application/json');
        $response->writeBody(json_encode($result));
    }

    public function actionExport(Request $request, Response $response): void
    {
        $id = $request->getRouteParam('id');
        $format = $request->getQueryParam('format', 'CSV');
        
        if (!$id) {
            throw new BadRequest('Report ID is required');
        }

        $reportService = $this->getRecordService();
        $result = $reportService->exportReport($id, $format);
        
        $response->setHeader('Content-Type', $result['contentType']);
        $response->setHeader('Content-Disposition', 'attachment; filename="' . $result['filename'] . '"');
        $response->writeBody($result['content']);
    }

    public function actionGetEntityFields(Request $request, Response $response): void
    {
        $entityType = $request->getQueryParam('entityType');
        if (!$entityType) {
            throw new BadRequest('Entity type is required');
        }

        $metadata = $this->getContainer()->get('metadata');
        $entityManager = $this->getContainer()->get('entityManager');
        
        if (!$entityManager->hasRepository($entityType)) {
            throw new BadRequest("Entity type '{$entityType}' does not exist");
        }

        $fieldDefs = $metadata->get(['entityDefs', $entityType, 'fields']) ?? [];
        $fields = [];
        
        foreach ($fieldDefs as $fieldName => $fieldDef) {
            if ($this->shouldSkipField($fieldName, $fieldDef)) {
                continue;
            }
            
            $fieldType = $fieldDef['type'] ?? 'varchar';
            $label = $this->getFieldLabel($entityType, $fieldName, $metadata);
            
            $fields[] = [
                'name' => $fieldName,
                'type' => $fieldType,
                'label' => $label
            ];
        }
        
        usort($fields, function($a, $b) {
            return strcmp($a['label'], $b['label']);
        });
        $response->writeBody(json_encode($fields));
    }

    private function shouldSkipField(string $fieldName, array $fieldDef): bool
    {
        $fieldType = $fieldDef['type'] ?? '';
        
        // Skip read-only system fields
        if (!empty($fieldDef['readOnly'])) {
            return true;
        }
        
        // Skip certain field types that don't make sense in reports
        $skipTypes = [
            'password', 'passwordConfirm', 'wysiwyg', 'longtext',
            'image', 'file', 'attachmentMultiple', 'linkMultiple',
            'currencyConverted', 'foreign'
        ];
        
        if (in_array($fieldType, $skipTypes)) {
            return true;
        }
        
        // Skip system fields
        $systemFields = [
            'deleted', 'versionNumber', 'followerIds', 'followersIds',
            'isFollowed', 'stream', 'emailAddressData', 'phoneNumberData'
        ];
        
        if (in_array($fieldName, $systemFields)) {
            return true;
        }
        
        // Skip fields ending with certain patterns
        $skipPatterns = ['Ids', 'Names', 'Data', 'Map'];
        foreach ($skipPatterns as $pattern) {
            if (substr($fieldName, -strlen($pattern)) === $pattern && $fieldName !== 'id') {
                return true;
            }
        }
        
        return false;
    }

    private function getFieldLabel(string $entityType, string $fieldName, $metadata): string
    {
        // Try to get label from language data
        $language = $this->getContainer()->get('language');
        
        // Try entity-specific label first
        $label = $language->translate($fieldName, 'fields', $entityType);
        
        // Fallback to global field label
        if ($label === $fieldName) {
            $label = $language->translate($fieldName, 'fields', 'Global');
        }
        
        // If still no translation, make a nice label from field name
        if ($label === $fieldName) {
            $label = $this->makeNiceLabel($fieldName);
        }
        
        return $label;
    }

    private function makeNiceLabel(string $fieldName): string
    {
        // Convert camelCase to Nice Label
        $label = preg_replace('/([A-Z])/', ' $1', $fieldName);
        $label = trim($label);
        $label = ucwords(strtolower($label));
        
        // Handle common abbreviations
        $replacements = [
            'Id' => 'ID',
            'Url' => 'URL',
            'Api' => 'API',
            'Html' => 'HTML',
            'Xml' => 'XML',
            'Json' => 'JSON'
        ];
        
        foreach ($replacements as $search => $replace) {
            $label = str_replace($search, $replace, $label);
        }
        
        return $label;
    }

    public function actionGetAvailableEntities(Request $request, Response $response)
    {
        try {
            error_log("Getting available entities");
            
            $metadata = $this->getContainer()->get('metadata');
            $entityManager = $this->getContainer()->get('entityManager');
            $language = $this->getContainer()->get('language');
            
            // Get all entity definitions
            $entityDefs = $metadata->get(['entityDefs']) ?? [];
            $entities = [];
            
            foreach ($entityDefs as $entityType => $entityDef) {
                try {
                    // Skip internal/system entities
                    if ($this->shouldSkipEntity($entityType, $entityDef)) {
                        continue;
                    }
                    
                    // Check if entity has a repository (is queryable)
                    if (!$entityManager->hasRepository($entityType)) {
                        continue;
                    }
                    
                    // Get entity label
                    $label = $language->translate($entityType, 'scopeNames');
                    if ($label === $entityType) {
                        $label = $this->makeNiceLabel($entityType);
                    }
                    
                    $entities[] = [
                        'name' => $entityType,
                        'label' => $label
                    ];
                    
                } catch (\Exception $entityError) {
                    error_log("Error processing entity {$entityType}: " . $entityError->getMessage());
                    continue;
                }
            }
            
            // Sort entities by label
            usort($entities, function($a, $b) {
                return strcmp($a['label'], $b['label']);
            });
            
            error_log("Found " . count($entities) . " available entities");
            $response->writeBody(json_encode($entities));
            
        } catch (\Exception $e) {
            error_log("Error in actionGetAvailableEntities: " . $e->getMessage());
            $response->setStatus(500);
            $response->writeBody(json_encode(['error' => $e->getMessage()]));
        }
    }

    private function shouldSkipEntity($entityType, $entityDef)
    {
        // Skip system/internal entities
        $systemEntities = [
            'ActionHistoryRecord', 'ArrayValue', 'Attachment', 'AuthenticationProvider',
            'AuthFailLogRecord', 'AuthLogRecord', 'AuthToken', 'EmailFolder',
            'EmailFilter', 'Export', 'Extension', 'GlobalStream', 'Import',
            'ImportError', 'Integration', 'Job', 'KnowledgeBaseArticle', 'LayoutRecord',
            'LayoutSet', 'LeadCapture', 'Note', 'Notification', 'PasswordChangeRequest',
            'Portal', 'PortalRole', 'Preferences', 'Role', 'ScheduledJob',
            'Stream', 'Subscription', 'Team', 'Template', 'UniqueId',
            'Webhook', 'WebhookQueueItem', 'WorkingTimeCalendar', 'WorkingTimeRange'
        ];
        
        if (in_array($entityType, $systemEntities)) {
            return true;
        }
        
        // Skip entities marked as not accessible
        if (isset($entityDef['disabled']) && $entityDef['disabled']) {
            return true;
        }
        
        // Skip entities without fields (likely system entities)
        if (empty($entityDef['fields'])) {
            return true;
        }
        
        return false;
    }

    public function actionPreview(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        
        if (!isset($data->targetEntity)) {
            throw new BadRequest("Target entity is required");
        }

        $tempReport = $this->getEntityManager()->getEntity('Report');
        $tempReport->set($data);
        
        $reportService = $this->getRecordService();
        $result = $reportService->runListReport($tempReport);
        
        $response->writeBody(json_encode([
            'preview' => array_slice($result['data'], 0, 10),
            'total' => $result['total']
        ]));
    }
}
