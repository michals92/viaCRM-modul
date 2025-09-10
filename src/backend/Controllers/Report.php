<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Controllers\Record;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;

class Report extends Record
{
    public function actionRun(Request $request, Response $response)
    {
        try {
            $id = $request->getRouteParam('id');
            if (!$id) {
                throw new BadRequest("Report ID is required");
            }

            error_log("Controller - Running report with ID: " . $id);
            
            $reportService = $this->getRecordService();
            $result = $reportService->runReport($id);
            
            error_log("Controller - Report result: " . json_encode($result));
            
            $response->setHeader('Content-Type', 'application/json');
            $response->writeBody(json_encode($result));
        } catch (\Exception $e) {
            error_log("Controller error in actionRun: " . $e->getMessage());
            error_log("Controller error trace: " . $e->getTraceAsString());
            
            $response->setStatus(500);
            $response->setHeader('Content-Type', 'application/json');
            $response->writeBody(json_encode([
                'error' => $e->getMessage(),
                'type' => 'list',
                'data' => [],
                'total' => 0
            ]));
        }
    }

    public function actionExport(Request $request, Response $response)
    {
        $id = $request->getRouteParam('id');
        $format = $request->getQueryParam('format', 'CSV');
        
        if (!$id) {
            throw new BadRequest("Report ID is required");
        }

        $reportService = $this->getRecordService();
        $result = $reportService->exportReport($id, $format);
        
        $response->setHeader('Content-Type', $result['contentType']);
        $response->setHeader('Content-Disposition', 'attachment; filename="' . $result['filename'] . '"');
        $response->writeBody($result['content']);
    }

    public function actionGetEntityFields(Request $request, Response $response)
    {
        try {
            $entityType = $request->getQueryParam('entityType');
            if (!$entityType) {
                throw new BadRequest("Entity type is required");
            }

            error_log("Getting fields for entity: " . $entityType);

            // Get entity metadata dynamically
            $metadata = $this->getContainer()->get('metadata');
            $entityManager = $this->getContainer()->get('entityManager');
            
            // Check if entity exists
            if (!$entityManager->hasRepository($entityType)) {
                throw new BadRequest("Entity type '{$entityType}' does not exist");
            }

            // Get field definitions from metadata
            $fieldDefs = $metadata->get(['entityDefs', $entityType, 'fields']) ?? [];
            
            $fields = [];
            
            // Process each field definition
            foreach ($fieldDefs as $fieldName => $fieldDef) {
                try {
                    // Skip system/internal fields that shouldn't be in reports
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
                    
                } catch (\Exception $fieldError) {
                    error_log("Error processing field {$fieldName}: " . $fieldError->getMessage());
                    // Skip problematic fields
                    continue;
                }
            }
            
            // Sort fields by label for better UX
            usort($fields, function($a, $b) {
                return strcmp($a['label'], $b['label']);
            });

            error_log("Found " . count($fields) . " fields for {$entityType}");
            $response->writeBody(json_encode($fields));
            
        } catch (\Exception $e) {
            error_log("Error in actionGetEntityFields: " . $e->getMessage());
            $response->setStatus(500);
            $response->writeBody(json_encode(['error' => $e->getMessage()]));
        }
    }

    private function shouldSkipField($fieldName, $fieldDef)
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

    private function getFieldLabel($entityType, $fieldName, $metadata)
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

    private function makeNiceLabel($fieldName)
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
