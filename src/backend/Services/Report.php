<?php

namespace Espo\Modules\ViaCrm\Services;

use Espo\Services\Record;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;

class Report extends Record
{

    public function runReport($id)
    {
        error_log("=== REPORT SERVICE START ===");
        error_log("RunReport called with ID: " . $id);
        
        try {
            // Step 1: Get report entity
            error_log("Step 1: Getting report entity");
            $report = $this->getEntity($id);
            
            if (!$report) {
                error_log("ERROR: Report not found");
                return ['error' => 'Report not found', 'type' => 'list', 'data' => [], 'total' => 0];
            }
            
            // Step 2: Get report configuration
            error_log("Step 2: Getting report configuration");
            $type = $report->get('type') ?? 'List';
            $targetEntity = $report->get('targetEntity') ?? 'User';
            $columns = $report->get('columns') ?? [];
            $chartType = $report->get('chartType') ?? 'Bar';
            $groupBy = $report->get('groupBy');
            
            error_log("Type: {$type}, Entity: {$targetEntity}");
            error_log("Columns: " . json_encode($columns));
            error_log("ChartType: {$chartType}, GroupBy: {$groupBy}");
            
            // Step 3: Try real database queries with safe fallback
            error_log("Step 3: Attempting real database queries");
            
            if ($type === 'Chart') {
                return $this->safeChartQuery($targetEntity, $groupBy, $chartType);
            }
            
            if ($type === 'Grid') {
                $listResult = $this->safeListQuery($targetEntity, $columns);
                return $this->convertToGrid($listResult, $groupBy);
            }
            
            // Default: List report
            return $this->safeListQuery($targetEntity, $columns);
            
        } catch (\Exception $e) {
            error_log("=== CRITICAL ERROR ===");
            error_log("Error: " . $e->getMessage());
            error_log("File: " . $e->getFile());
            error_log("Line: " . $e->getLine());
            error_log("Trace: " . $e->getTraceAsString());
            
            return [
                'type' => 'list',
                'data' => [],
                'total' => 0,
                'error' => $e->getMessage(),
                'debug' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ];
        } finally {
            error_log("=== REPORT SERVICE END ===");
        }
    }

    private function safeListQuery($targetEntity, $columns)
    {
        try {
            error_log("SafeListQuery: Entity={$targetEntity}, Columns=" . json_encode($columns));
            
            // Check if repository exists
            if (!$this->entityManager->hasRepository($targetEntity)) {
                error_log("Repository not found for {$targetEntity}");
                throw new \Exception("Entity repository not found");
            }
            
            $repository = $this->entityManager->getRepository($targetEntity);
            error_log("Repository obtained successfully");
            
            // Very basic query
            $collection = $repository->find(['maxSize' => 10]);
            $count = count($collection);
            error_log("Query executed, found {$count} records");
            
            if ($count === 0) {
                return [
                    'type' => 'list',
                    'data' => [],
                    'total' => 0,
                    'message' => "No records found for {$targetEntity}"
                ];
            }
            
            $result = [];
            foreach ($collection as $entity) {
                try {
                    // Safe data extraction
                    $data = [];
                    
                    if (!empty($columns)) {
                        // Get only requested columns
                        foreach ($columns as $column) {
                            try {
                                $data[$column] = $entity->get($column);
                            } catch (\Exception $e) {
                                $data[$column] = null;
                                error_log("Error getting column {$column}: " . $e->getMessage());
                            }
                        }
                    } else {
                        // Get safe basic fields dynamically
                        $data = $this->extractSafeEntityData($entity, $targetEntity);
                    }
                    
                    if (!empty($data)) {
                        $result[] = $data;
                    }
                    
                } catch (\Exception $entityError) {
                    error_log("Error processing entity: " . $entityError->getMessage());
                    // Skip problematic entities
                    continue;
                }
            }
            
            return [
                'type' => 'list',
                'data' => $result,
                'total' => count($result),
                'entityType' => $targetEntity,
                'columnsUsed' => $columns
            ];
            
        } catch (\Exception $e) {
            error_log("SafeListQuery error: " . $e->getMessage());
            
            // Fallback to sample data
            $sampleData = !empty($columns) ? 
                array_fill_keys($columns, 'Sample Value') : 
                ['id' => '1', 'name' => 'Sample Record'];
                
            return [
                'type' => 'list',
                'data' => [$sampleData],
                'total' => 1,
                'error' => 'Using sample data: ' . $e->getMessage(),
                'entityType' => $targetEntity
            ];
        }
    }

    private function safeChartQuery($targetEntity, $groupBy, $chartType)
    {
        try {
            error_log("SafeChartQuery: Entity={$targetEntity}, GroupBy={$groupBy}, ChartType={$chartType}");
            
            if (!$groupBy) {
                throw new \Exception("Group By field required for charts");
            }
            
            if (!$this->entityManager->hasRepository($targetEntity)) {
                throw new \Exception("Entity repository not found");
            }
            
            $repository = $this->entityManager->getRepository($targetEntity);
            $collection = $repository->find(['maxSize' => 50]);
            
            $chartData = [];
            foreach ($collection as $entity) {
                try {
                    $value = $entity->get($groupBy);
                    
                    if ($value === null || $value === '') {
                        $value = 'Unknown';
                    } elseif (is_bool($value)) {
                        $value = $value ? 'Yes' : 'No';
                    } else {
                        $value = (string)$value;
                    }
                    
                    $chartData[$value] = ($chartData[$value] ?? 0) + 1;
                    
                } catch (\Exception $e) {
                    // Skip problematic entities
                    continue;
                }
            }
            
            // Sort and limit
            arsort($chartData);
            $chartData = array_slice($chartData, 0, 8, true);
            
            if (empty($chartData)) {
                $chartData = ['No Data' => 0];
            }
            
            return [
                'type' => 'chart',
                'chartType' => $chartType,
                'labels' => array_keys($chartData),
                'datasets' => [
                    [
                        'label' => ucfirst($groupBy) . ' Count',
                        'data' => array_values($chartData),
                        'backgroundColor' => $this->generateColors(count($chartData))
                    ]
                ],
                'total' => array_sum($chartData),
                'entityType' => $targetEntity,
                'groupBy' => $groupBy
            ];
            
        } catch (\Exception $e) {
            error_log("SafeChartQuery error: " . $e->getMessage());
            
            // Fallback to sample chart
            return [
                'type' => 'chart',
                'chartType' => $chartType,
                'labels' => ['Sample A', 'Sample B'],
                'datasets' => [
                    [
                        'label' => ($groupBy ?: 'Status') . ' Count',
                        'data' => [3, 2],
                        'backgroundColor' => ['#36A2EB', '#FF6384']
                    ]
                ],
                'total' => 5,
                'error' => 'Using sample data: ' . $e->getMessage()
            ];
        }
    }

    private function convertToGrid($listResult, $groupBy)
    {
        try {
            if ($listResult['type'] !== 'list' || empty($listResult['data'])) {
                return $listResult; // Return as-is if not valid list data
            }
            
            $groupedData = [];
            foreach ($listResult['data'] as $row) {
                $groupValue = $row[$groupBy] ?? 'Unknown';
                $groupValue = (string)$groupValue;
                
                if (!isset($groupedData[$groupValue])) {
                    $groupedData[$groupValue] = [];
                }
                $groupedData[$groupValue][] = $row;
            }
            
            return [
                'type' => 'grid',
                'data' => $groupedData,
                'groupBy' => $groupBy,
                'total' => $listResult['total'],
                'entityType' => $listResult['entityType'] ?? 'Unknown'
            ];
            
        } catch (\Exception $e) {
            error_log("ConvertToGrid error: " . $e->getMessage());
            return $listResult; // Return original data on error
        }
    }

    private function runListReport($report)
    {
        try {
            $targetEntity = $report->get('targetEntity');
            $columns = $report->get('columns') ?? [];
            $orderBy = $report->get('orderBy');
            $orderDirection = $report->get('orderDirection') ?? 'ASC';
            
            error_log("List Report - Target: {$targetEntity}, Columns: " . json_encode($columns));
            error_log("List Report - OrderBy: {$orderBy}, Direction: {$orderDirection}");
            
            if (!$this->entityManager->hasRepository($targetEntity)) {
                throw new \Exception("Entity '{$targetEntity}' repository not found");
            }
            
            $repository = $this->entityManager->getRepository($targetEntity);
            
            // Build query parameters
            $params = ['maxSize' => 20];
            
            if ($orderBy) {
                $params['orderBy'] = $orderBy;
                $params['order'] = $orderDirection;
            }
            
            $collection = $repository->find($params);
            $count = count($collection);
            error_log("Found {$count} records for {$targetEntity}");
            
            if ($count === 0) {
                return [
                    'type' => 'list',
                    'data' => [],
                    'total' => 0,
                    'message' => "No records found for {$targetEntity}"
                ];
            }
            
            $result = [];
            foreach ($collection as $entity) {
                try {
                    $entityData = $entity->getValueMap();
                    
                    // If specific columns are selected, filter to only those
                    if (!empty($columns)) {
                        $filteredData = [];
                        foreach ($columns as $column) {
                            $filteredData[$column] = $entityData[$column] ?? null;
                        }
                        $result[] = $filteredData;
                        error_log("Filtered data for columns: " . json_encode($filteredData));
                    } else {
                        // Show common fields for better readability
                        $commonFields = ['id', 'name', 'status', 'createdAt', 'emailAddress', 'userName', 'firstName', 'lastName'];
                        $basicData = [];
                        foreach ($commonFields as $field) {
                            if (isset($entityData[$field]) && $entityData[$field] !== null) {
                                $basicData[$field] = $entityData[$field];
                            }
                        }
                        $result[] = $basicData;
                    }
                    
                } catch (\Exception $entityError) {
                    error_log("Error processing entity: " . $entityError->getMessage());
                    $result[] = ['id' => 'error', 'name' => 'Error loading entity'];
                }
            }
            
            return [
                'type' => 'list',
                'data' => $result,
                'total' => count($result),
                'entityType' => $targetEntity,
                'columnsUsed' => $columns
            ];
            
        } catch (\Exception $e) {
            error_log("List Report error: " . $e->getMessage());
            return [
                'type' => 'list',
                'data' => [],
                'total' => 0,
                'error' => $e->getMessage()
            ];
        }
    }

    private function runGridReport($report)
    {
        $listData = $this->runListReport($report);
        $groupBy = $report->get('groupBy');
        
        if (!$groupBy) {
            return $listData;
        }
        
        $groupedData = [];
        foreach ($listData['data'] as $row) {
            $groupValue = $row[$groupBy] ?? 'Unknown';
            if (!isset($groupedData[$groupValue])) {
                $groupedData[$groupValue] = [];
            }
            $groupedData[$groupValue][] = $row;
        }
        
        return [
            'type' => 'grid',
            'data' => $groupedData,
            'groupBy' => $groupBy,
            'total' => $listData['total']
        ];
    }

    private function runChartReport($report)
    {
        try {
            $chartType = $report->get('chartType') ?? 'Bar';
            $targetEntity = $report->get('targetEntity');
            $groupBy = $report->get('groupBy');
            
            error_log("Chart Report - Target: {$targetEntity}, GroupBy: {$groupBy}, ChartType: {$chartType}");
            
            if (!$groupBy) {
                throw new \Exception("Group By field is required for chart reports");
            }
            
            if (!$this->entityManager->hasRepository($targetEntity)) {
                throw new \Exception("Entity '{$targetEntity}' repository not found");
            }
            
            $repository = $this->entityManager->getRepository($targetEntity);
            $collection = $repository->find(['maxSize' => 100]);
            
            $chartData = [];
            foreach ($collection as $entity) {
                try {
                    $groupValue = $entity->get($groupBy);
                    
                    // Handle different data types
                    if ($groupValue === null || $groupValue === '') {
                        $groupValue = 'Unknown';
                    } else if (is_bool($groupValue)) {
                        $groupValue = $groupValue ? 'True' : 'False';
                    } else {
                        $groupValue = (string)$groupValue;
                    }
                    
                    if (!isset($chartData[$groupValue])) {
                        $chartData[$groupValue] = 0;
                    }
                    $chartData[$groupValue]++;
                    
                } catch (\Exception $entityError) {
                    error_log("Error processing entity for chart: " . $entityError->getMessage());
                    // Skip problematic entities
                    continue;
                }
            }
            
            // Sort by count descending, limit to top 8 for readability
            arsort($chartData);
            $chartData = array_slice($chartData, 0, 8, true);
            
            $labels = array_keys($chartData);
            $values = array_values($chartData);
            
            error_log("Chart data: " . json_encode($chartData));
            
            if (empty($chartData)) {
                return [
                    'type' => 'chart',
                    'chartType' => $chartType,
                    'labels' => ['No Data'],
                    'datasets' => [
                        [
                            'label' => ($groupBy ?: 'Status') . ' Count',
                            'data' => [0],
                            'backgroundColor' => ['#cccccc']
                        ]
                    ],
                    'total' => 0,
                    'message' => "No data found for {$targetEntity} grouped by {$groupBy}"
                ];
            }
            
            return [
                'type' => 'chart',
                'chartType' => $chartType,
                'labels' => $labels,
                'datasets' => [
                    [
                        'label' => ucfirst($groupBy) . ' Count',
                        'data' => $values,
                        'backgroundColor' => $this->generateColors(count($labels))
                    ]
                ],
                'total' => array_sum($values),
                'entityType' => $targetEntity,
                'groupBy' => $groupBy
            ];
            
        } catch (\Exception $e) {
            error_log("Chart Report error: " . $e->getMessage());
            return [
                'type' => 'chart',
                'chartType' => 'Bar',
                'labels' => ['Error'],
                'datasets' => [
                    [
                        'label' => 'Count',
                        'data' => [1],
                        'backgroundColor' => ['#ff4444']
                    ]
                ],
                'total' => 1,
                'error' => $e->getMessage()
            ];
        }
    }


    private function applyDateFilters(&$params, $report)
    {
        $dateFilter = $report->get('dateFilter');
        if (!$dateFilter) {
            return;
        }
        
        $dateFrom = null;
        $dateTo = null;
        
        switch ($dateFilter) {
            case 'today':
                $dateFrom = date('Y-m-d');
                $dateTo = date('Y-m-d');
                break;
            case 'thisWeek':
                $dateFrom = date('Y-m-d', strtotime('monday this week'));
                $dateTo = date('Y-m-d', strtotime('sunday this week'));
                break;
            case 'thisMonth':
                $dateFrom = date('Y-m-01');
                $dateTo = date('Y-m-t');
                break;
            case 'thisYear':
                $dateFrom = date('Y-01-01');
                $dateTo = date('Y-12-31');
                break;
            case 'lastMonth':
                $dateFrom = date('Y-m-01', strtotime('last month'));
                $dateTo = date('Y-m-t', strtotime('last month'));
                break;
            case 'lastYear':
                $dateFrom = date('Y-01-01', strtotime('last year'));
                $dateTo = date('Y-12-31', strtotime('last year'));
                break;
            case 'custom':
                $dateFrom = $report->get('dateFrom');
                $dateTo = $report->get('dateTo');
                break;
        }
        
        if ($dateFrom || $dateTo) {
            // Initialize where array if not set
            if (!isset($params['where'])) {
                $params['where'] = [];
            }
            
            if ($dateFrom) {
                $params['where'][] = [
                    'createdAt>=' => $dateFrom . ' 00:00:00'
                ];
            }
            if ($dateTo) {
                $params['where'][] = [
                    'createdAt<=' => $dateTo . ' 23:59:59'
                ];
            }
        }
    }

    private function generateColors($count)
    {
        $colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
            '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
        ];
        
        $result = [];
        for ($i = 0; $i < $count; $i++) {
            $result[] = $colors[$i % count($colors)];
        }
        
        return $result;
    }

    public function exportReport($id, $format)
    {
        $reportData = $this->runReport($id);
        $report = $this->getEntity($id);
        
        $exportFormats = $report->get('exportFormats') ?? ['CSV'];
        
        if (!in_array($format, $exportFormats)) {
            throw new BadRequest("Export format not allowed for this report");
        }
        
        switch ($format) {
            case 'CSV':
                return $this->exportToCsv($reportData, $report);
            case 'Excel':
                return $this->exportToExcel($reportData, $report);
            case 'PDF':
                return $this->exportToPdf($reportData, $report);
            default:
                throw new BadRequest("Unsupported export format");
        }
    }

    private function exportToCsv($data, $report)
    {
        $csv = '';
        
        if ($data['type'] === 'list' && !empty($data['data'])) {
            $headers = array_keys($data['data'][0]);
            $csv .= implode(',', $headers) . "\n";
            
            foreach ($data['data'] as $row) {
                $csv .= implode(',', array_map(function($value) {
                    return '"' . str_replace('"', '""', $value) . '"';
                }, $row)) . "\n";
            }
        }
        
        return [
            'content' => $csv,
            'contentType' => 'text/csv',
            'filename' => $report->get('name') . '_' . date('Y-m-d_H-i-s') . '.csv'
        ];
    }

    private function exportToExcel($data, $report)
    {
        return [
            'content' => 'Excel export not implemented yet',
            'contentType' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'filename' => $report->get('name') . '_' . date('Y-m-d_H-i-s') . '.xlsx'
        ];
    }

    private function exportToPdf($data, $report)
    {
        return [
            'content' => 'PDF export not implemented yet',
            'contentType' => 'application/pdf',
            'filename' => $report->get('name') . '_' . date('Y-m-d_H-i-s') . '.pdf'
        ];
    }

    private function extractSafeEntityData($entity, $targetEntity)
    {
        try {
            // Get field definitions from metadata
            $metadata = $this->getContainer()->get('metadata');
            $fieldDefs = $metadata->get(['entityDefs', $targetEntity, 'fields']) ?? [];
            
            $data = [];
            $safeFieldTypes = [
                'varchar', 'int', 'float', 'bool', 'date', 'datetime', 
                'enum', 'email', 'phone', 'url', 'currency'
            ];
            
            // Always include ID if available
            if ($entity->hasAttribute('id')) {
                $data['id'] = $entity->get('id');
            }
            
            // Extract fields based on metadata
            foreach ($fieldDefs as $fieldName => $fieldDef) {
                try {
                    $fieldType = $fieldDef['type'] ?? '';
                    
                    // Skip unsuitable fields
                    if (!in_array($fieldType, $safeFieldTypes)) {
                        continue;
                    }
                    
                    // Skip read-only fields except for basic ones
                    if (!empty($fieldDef['readOnly']) && !in_array($fieldName, ['createdAt', 'modifiedAt'])) {
                        continue;
                    }
                    
                    // Skip system fields
                    if (in_array($fieldName, ['deleted', 'versionNumber'])) {
                        continue;
                    }
                    
                    if ($entity->hasAttribute($fieldName)) {
                        $value = $entity->get($fieldName);
                        
                        // Format value based on type
                        $data[$fieldName] = $this->formatFieldValue($value, $fieldType);
                        
                        // Limit to reasonable number of fields for display
                        if (count($data) >= 8) {
                            break;
                        }
                    }
                } catch (\Exception $e) {
                    // Skip problematic fields
                    continue;
                }
            }
            
            // Fallback to basic fields if nothing was extracted
            if (empty($data) || count($data) <= 1) { // Only ID
                $basicFields = ['name', 'title', 'subject', 'status', 'type', 'createdAt'];
                foreach ($basicFields as $field) {
                    try {
                        if ($entity->hasAttribute($field)) {
                            $data[$field] = $entity->get($field);
                        }
                    } catch (\Exception $e) {
                        // Skip
                    }
                }
            }
            
            return $data;
            
        } catch (\Exception $e) {
            error_log("Error extracting entity data: " . $e->getMessage());
            
            // Ultimate fallback
            return ['id' => $entity->get('id') ?? 'unknown'];
        }
    }
    
    private function formatFieldValue($value, $fieldType)
    {
        if ($value === null) {
            return null;
        }
        
        switch ($fieldType) {
            case 'bool':
                return $value ? 'Yes' : 'No';
            case 'date':
            case 'datetime':
                if ($value instanceof \DateTime) {
                    return $value->format($fieldType === 'date' ? 'Y-m-d' : 'Y-m-d H:i:s');
                }
                return (string)$value;
            case 'currency':
            case 'float':
                return is_numeric($value) ? number_format((float)$value, 2) : $value;
            case 'int':
                return is_numeric($value) ? (int)$value : $value;
            default:
                return (string)$value;
        }
    }
}
