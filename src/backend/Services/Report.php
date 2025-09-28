<?php

namespace Espo\Modules\ViaCrm\Services;

use Espo\Services\Record;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Exceptions\Error;

class Report extends Record
{
    private const DEFAULT_MAX_SIZE = 100;
    private const CHART_MAX_SIZE = 200;
    private const PREVIEW_MAX_SIZE = 10;
    
    private const SUPPORTED_CHART_TYPES = ['Bar', 'Line', 'Pie', 'Doughnut'];
    private const SUPPORTED_REPORT_TYPES = ['List', 'Grid', 'Chart'];
    
    private const SAFE_FIELD_TYPES = [
        'varchar', 'text', 'int', 'float', 'bool', 'date', 'datetime',
        'enum', 'email', 'phone', 'url', 'currency', 'link'
    ];

    public function runReport(string $id): array
    {
        try {
            $report = $this->getEntity($id);
            
            if (!$report) {
                throw new NotFound('Report not found');
            }
            
            $type = $report->get('type') ?? 'List';
            $targetEntity = $report->get('targetEntity');
            
            if (!$targetEntity) {
                throw new BadRequest('Target entity is required');
            }
            
            if (!in_array($type, self::SUPPORTED_REPORT_TYPES)) {
                throw new BadRequest('Unsupported report type');
            }
            
            return match ($type) {
                'Chart' => $this->runChartReport($report),
                'Grid' => $this->runGridReport($report),
                default => $this->runListReport($report)
            };
        } catch (\Exception $e) {
            $this->getLogger()->error('Report execution failed', [
                'reportId' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw new Error('Failed to execute report: ' . $e->getMessage());
        }
    }

    private function executeListQuery(string $targetEntity, array $columns, array $params = []): array
    {
        if (!$this->entityManager->hasRepository($targetEntity)) {
            throw new BadRequest("Entity '{$targetEntity}' not found");
        }
        
        $repository = $this->entityManager->getRepository($targetEntity);
        $queryParams = array_merge(['maxSize' => self::DEFAULT_MAX_SIZE], $params);
        
        $collection = $repository->find($queryParams);
        
        if ($collection->count() === 0) {
            return [
                'type' => 'list',
                'data' => [],
                'total' => 0,
                'entityType' => $targetEntity
            ];
        }
        
        $result = [];
        foreach ($collection as $entity) {
            $data = $this->extractEntityData($entity, $columns, $targetEntity);
            if (!empty($data)) {
                $result[] = $data;
            }
        }
        
        return [
            'type' => 'list',
            'data' => $result,
            'total' => count($result),
            'entityType' => $targetEntity
        ];
    }

    private function executeChartQuery(string $targetEntity, ?string $groupBy, string $chartType): array
    {
        if (!$groupBy) {
            throw new BadRequest('Group By field is required for chart reports');
        }
        
        if (!in_array($chartType, self::SUPPORTED_CHART_TYPES)) {
            throw new BadRequest('Unsupported chart type');
        }
        
        if (!$this->entityManager->hasRepository($targetEntity)) {
            throw new BadRequest("Entity '{$targetEntity}' not found");
        }
        
        $repository = $this->entityManager->getRepository($targetEntity);
        $collection = $repository->find(['maxSize' => self::CHART_MAX_SIZE]);
        
        $chartData = $this->aggregateChartData($collection, $groupBy);
        
        if (empty($chartData)) {
            return $this->createEmptyChartResponse($chartType, $groupBy, $targetEntity);
        }
        
        arsort($chartData);
        $chartData = array_slice($chartData, 0, 8, true);
        
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
    }

    private function convertToGrid(array $listResult, ?string $groupBy): array
    {
        if ($listResult['type'] !== 'list' || empty($listResult['data']) || !$groupBy) {
            return $listResult;
        }
        
        $groupedData = [];
        foreach ($listResult['data'] as $row) {
            $groupValue = (string)($row[$groupBy] ?? 'Unknown');
            $groupedData[$groupValue][] = $row;
        }
        
        return [
            'type' => 'grid',
            'data' => $groupedData,
            'groupBy' => $groupBy,
            'total' => $listResult['total'],
            'entityType' => $listResult['entityType'] ?? 'Unknown'
        ];
    }

    private function runListReport($report): array
    {
        $targetEntity = $report->get('targetEntity');
        $columns = $report->get('columns') ?? [];
        $orderBy = $report->get('orderBy');
        $orderDirection = $report->get('orderDirection') ?? 'ASC';
        
        $params = ['maxSize' => self::DEFAULT_MAX_SIZE];
        
        if ($orderBy) {
            $params['orderBy'] = $orderBy;
            $params['order'] = $orderDirection;
        }
        
        return $this->executeListQuery($targetEntity, $columns, $params);
    }

    private function runGridReport($report): array
    {
        $listData = $this->runListReport($report);
        $groupBy = $report->get('groupBy');
        
        return $this->convertToGrid($listData, $groupBy);
    }

    private function runChartReport($report): array
    {
        $chartType = $report->get('chartType') ?? 'Bar';
        $targetEntity = $report->get('targetEntity');
        $groupBy = $report->get('groupBy');
        
        return $this->executeChartQuery($targetEntity, $groupBy, $chartType);
    }


    private function aggregateChartData($collection, string $groupBy): array
    {
        $chartData = [];
        foreach ($collection as $entity) {
            try {
                $groupValue = $entity->get($groupBy);
                $groupValue = $this->normalizeGroupValue($groupValue);
                $chartData[$groupValue] = ($chartData[$groupValue] ?? 0) + 1;
            } catch (\Exception $e) {
                continue;
            }
        }
        return $chartData;
    }
    
    private function normalizeGroupValue($value): string
    {
        if ($value === null || $value === '') {
            return 'Unknown';
        }
        
        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }
        
        return (string)$value;
    }
    
    private function createEmptyChartResponse(string $chartType, string $groupBy, string $targetEntity): array
    {
        return [
            'type' => 'chart',
            'chartType' => $chartType,
            'labels' => ['No Data'],
            'datasets' => [
                [
                    'label' => ucfirst($groupBy) . ' Count',
                    'data' => [0],
                    'backgroundColor' => ['#cccccc']
                ]
            ],
            'total' => 0,
            'entityType' => $targetEntity,
            'groupBy' => $groupBy
        ];
    }
    
    private function extractEntityData($entity, array $columns, string $targetEntity): array
    {
        if (!empty($columns)) {
            return $this->extractSpecificColumns($entity, $columns);
        }
        
        return $this->extractSafeEntityData($entity, $targetEntity);
    }
    
    private function extractSpecificColumns($entity, array $columns): array
    {
        $data = [];
        foreach ($columns as $column) {
            try {
                $data[$column] = $entity->get($column);
            } catch (\Exception $e) {
                $data[$column] = null;
            }
        }
        return $data;
    }
    
    private function applyDateFilters(array &$params, $report): void
    {
        $dateFilter = $report->get('dateFilter');
        if (!$dateFilter) {
            return;
        }
        
        [$dateFrom, $dateTo] = $this->calculateDateRange($dateFilter, $report);
        
        if ($dateFrom || $dateTo) {
            if (!isset($params['where'])) {
                $params['where'] = [];
            }
            
            if ($dateFrom) {
                $params['where'][] = ['createdAt>=' => $dateFrom . ' 00:00:00'];
            }
            if ($dateTo) {
                $params['where'][] = ['createdAt<=' => $dateTo . ' 23:59:59'];
            }
        }
    }
    
    private function calculateDateRange(string $dateFilter, $report): array
    {
        return match ($dateFilter) {
            'today' => [date('Y-m-d'), date('Y-m-d')],
            'thisWeek' => [
                date('Y-m-d', strtotime('monday this week')),
                date('Y-m-d', strtotime('sunday this week'))
            ],
            'thisMonth' => [date('Y-m-01'), date('Y-m-t')],
            'thisYear' => [date('Y-01-01'), date('Y-12-31')],
            'lastMonth' => [
                date('Y-m-01', strtotime('last month')),
                date('Y-m-t', strtotime('last month'))
            ],
            'lastYear' => [
                date('Y-01-01', strtotime('last year')),
                date('Y-12-31', strtotime('last year'))
            ],
            'custom' => [
                $report->get('dateFrom'),
                $report->get('dateTo')
            ],
            default => [null, null]
        };
    }

    private function generateColors(int $count): array
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

    public function exportReport(string $id, string $format): array
    {
        $reportData = $this->runReport($id);
        $report = $this->getEntity($id);
        
        if (!$report) {
            throw new NotFound('Report not found');
        }
        
        $exportFormats = $report->get('exportFormats') ?? ['CSV'];
        
        if (!in_array($format, $exportFormats)) {
            throw new BadRequest('Export format not allowed for this report');
        }
        
        return match ($format) {
            'CSV' => $this->exportToCsv($reportData, $report),
            'Excel' => $this->exportToExcel($reportData, $report),
            'PDF' => $this->exportToPdf($reportData, $report),
            default => throw new BadRequest('Unsupported export format')
        };
    }

    private function exportToCsv(array $data, $report): array
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

    private function exportToExcel(array $data, $report): array
    {
        return [
            'content' => 'Excel export not implemented yet',
            'contentType' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'filename' => $report->get('name') . '_' . date('Y-m-d_H-i-s') . '.xlsx'
        ];
    }

    private function exportToPdf(array $data, $report): array
    {
        return [
            'content' => 'PDF export not implemented yet',
            'contentType' => 'application/pdf',
            'filename' => $report->get('name') . '_' . date('Y-m-d_H-i-s') . '.pdf'
        ];
    }

    private function extractSafeEntityData($entity, string $targetEntity): array
    {
        try {
            $metadata = $this->getContainer()->get('metadata');
            $fieldDefs = $metadata->get(['entityDefs', $targetEntity, 'fields']) ?? [];
            
            $data = [];
            
            if ($entity->hasAttribute('id')) {
                $data['id'] = $entity->get('id');
            }
            
            foreach ($fieldDefs as $fieldName => $fieldDef) {
                if (!$this->isValidFieldForExtraction($fieldName, $fieldDef, $entity)) {
                    continue;
                }
                
                $fieldType = $fieldDef['type'] ?? 'varchar';
                $value = $entity->get($fieldName);
                $data[$fieldName] = $this->formatFieldValue($value, $fieldType);
                
                if (count($data) >= 8) {
                    break;
                }
            }
            
            if (count($data) <= 1) {
                $data = array_merge($data, $this->extractBasicFields($entity));
            }
            
            return $data;
            
        } catch (\Exception $e) {
            return ['id' => $entity->get('id') ?? 'unknown'];
        }
    }
    
    private function isValidFieldForExtraction(string $fieldName, array $fieldDef, $entity): bool
    {
        $fieldType = $fieldDef['type'] ?? '';
        
        if (!in_array($fieldType, self::SAFE_FIELD_TYPES)) {
            return false;
        }
        
        if (!empty($fieldDef['readOnly']) && !in_array($fieldName, ['createdAt', 'modifiedAt'])) {
            return false;
        }
        
        if (in_array($fieldName, ['deleted', 'versionNumber'])) {
            return false;
        }
        
        return $entity->hasAttribute($fieldName);
    }
    
    private function extractBasicFields($entity): array
    {
        $basicFields = ['name', 'title', 'subject', 'status', 'type', 'createdAt'];
        $data = [];
        
        foreach ($basicFields as $field) {
            try {
                if ($entity->hasAttribute($field)) {
                    $data[$field] = $entity->get($field);
                }
            } catch (\Exception $e) {
                continue;
            }
        }
        
        return $data;
    }
    
    private function formatFieldValue($value, string $fieldType)
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
            case 'text':
                // Truncate long text for display
                $textValue = (string)$value;
                return strlen($textValue) > 100 ? substr($textValue, 0, 100) . '...' : $textValue;
            case 'link':
                // For link fields, show the name if available
                return is_array($value) && isset($value['name']) ? $value['name'] : (string)$value;
            default:
                return (string)$value;
        }
    }
}
