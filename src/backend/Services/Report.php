<?php

namespace Espo\Modules\ViaCrm\Services;

use Espo\Services\Record;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Exceptions\Error;
use Espo\Tools\Pdf\Service as PdfService;
use Espo\Core\Utils\TemplateFileManager;
use Espo\Core\Htmlizer\Factory as HtmlizerFactory;

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
            
            switch ($type) {
                case 'Chart':
                    return $this->runChartReport($report);
                case 'Grid':
                    return $this->runGridReport($report);
                default:
                    return $this->runListReport($report);
            }
        } catch (\Exception $e) {
            throw new Error('Failed to execute report: ' . $e->getMessage());
        }
    }

    public function runReportPreview($reportData): array
    {
        $targetEntity = $reportData->targetEntity ?? null;
        
        if (!$targetEntity) {
            throw new BadRequest('Target entity is required');
        }
        
        $columns = $reportData->columns ?? [];
        $orderBy = $reportData->orderBy ?? null;
        $orderDirection = $reportData->orderDirection ?? 'ASC';
        
        $params = ['maxSize' => self::PREVIEW_MAX_SIZE];
        
        if ($orderBy) {
            $params['orderBy'] = $orderBy;
            $params['order'] = $orderDirection;
        }
        
        return $this->executeListQuery($targetEntity, $columns, $params);
    }

    private function executeListQuery(string $targetEntity, array $columns, array $params = []): array
    {
        if (!$this->entityManager->hasRepository($targetEntity)) {
            throw new BadRequest("Entity '{$targetEntity}' not found");
        }
        
        $repository = $this->entityManager->getRepository($targetEntity);
        
        // Build query parameters with proper EspoCRM format
        $queryParams = [
            'maxSize' => $params['maxSize'] ?? self::DEFAULT_MAX_SIZE
        ];
        
        // Add ordering if specified - try multiple EspoCRM formats
        if (!empty($params['orderBy'])) {
            $orderDirection = strtolower($params['order'] ?? 'ASC');
            
            // Format 1: Standard EspoCRM format
            $queryParams['orderBy'] = $params['orderBy'];
            $queryParams['order'] = $orderDirection;
            
            // Format 2: Alternative format with orderDirection
            $queryParams['orderDirection'] = $orderDirection;
            
            // Format 3: Array format (some EspoCRM versions)
            $queryParams['orderByList'] = [
                [$params['orderBy'], $orderDirection]
            ];
            
        }
        
        
        try {
            // Try multiple approaches for ordering
            $collection = null;
            
            // Approach 1: Standard repository find
            try {
                $collection = $repository->find($queryParams);
            } catch (\Exception $e1) {
                
                // Approach 2: Use SelectBuilder if available
                try {
                    if (method_exists($this->entityManager, 'getQueryBuilder')) {
                        $queryBuilder = $this->entityManager->getQueryBuilder()
                            ->select()
                            ->from($targetEntity)
                            ->limit($queryParams['maxSize']);
                        
                        if (!empty($params['orderBy'])) {
                            $queryBuilder->order($params['orderBy'], strtoupper($params['order'] ?? 'ASC'));
                        }
                        
                        $query = $queryBuilder->build();
                        $collection = $this->entityManager->getCollectionFactory()->createFromQuery($query);
                    }
                } catch (\Exception $e2) {
                    // Approach 3: Manual sorting fallback
                    $simpleParams = ['maxSize' => $queryParams['maxSize']];
                    $collection = $repository->find($simpleParams);
                }
            }
            
            if (!$collection) {
                throw new Error('Failed to execute query with all approaches');
            }
            
        } catch (\Exception $e) {
            throw $e;
        }
        
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
        
        // Manual sorting if orderBy is specified and we suspect DB sorting didn't work
        if (!empty($params['orderBy']) && count($result) > 1) {
            $orderField = $params['orderBy'];
            $orderDirection = strtoupper($params['order'] ?? 'ASC');
            
            
            usort($result, function($a, $b) use ($orderField, $orderDirection) {
                $aValue = $a[$orderField] ?? '';
                $bValue = $b[$orderField] ?? '';
                
                // Handle different data types
                if (is_numeric($aValue) && is_numeric($bValue)) {
                    $comparison = (float)$aValue <=> (float)$bValue;
                } else {
                    $comparison = strcasecmp((string)$aValue, (string)$bValue);
                }
                
                return $orderDirection === 'DESC' ? -$comparison : $comparison;
            });
            
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
        
        switch ($format) {
            case 'CSV':
                return $this->exportToCsv($reportData, $report);
            case 'Excel':
            case 'XLSX':
                return $this->exportToExcel($reportData, $report);
            case 'PDF':
                return $this->exportToPdf($reportData, $report);
            default:
                throw new BadRequest('Unsupported export format');
        }
    }

    private function exportToCsv(array $data, $report): array
    {
        $csv = '';
        $reportName = $report->get('name') ?? 'Report';
        
        switch ($data['type']) {
            case 'list':
                $csv = $this->generateListCsv($data);
                break;
            case 'grid':
                $csv = $this->generateGridCsv($data);
                break;
            case 'chart':
                $csv = $this->generateChartCsv($data);
                break;
            default:
                throw new BadRequest('Unsupported report type for CSV export');
        }
        
        return [
            'content' => $csv,
            'contentType' => 'text/csv',
            'filename' => $this->sanitizeFileName($reportName) . '_' . date('Y-m-d_H-i-s') . '.csv'
        ];
    }


    private function extractSafeEntityData($entity, string $targetEntity): array
    {
        try {
            $metadata = $this->getMetadata();
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

    private function generateListCsv(array $data): string
    {
        $csv = '';
        
        if (!empty($data['data'])) {
            $headers = array_keys($data['data'][0]);
            $csv .= $this->arrayToCsvRow($headers) . "\n";
            
            foreach ($data['data'] as $row) {
                $csv .= $this->arrayToCsvRow(array_values($row)) . "\n";
            }
        }
        
        return $csv;
    }

    private function generateGridCsv(array $data): string
    {
        $csv = "Group,Item Count\n";
        
        if (!empty($data['data'])) {
            foreach ($data['data'] as $group => $items) {
                $csv .= $this->arrayToCsvRow([$group, count($items)]) . "\n";
            }
        }
        
        return $csv;
    }

    private function generateChartCsv(array $data): string
    {
        $csv = "Label,Value\n";
        
        if (!empty($data['labels']) && !empty($data['datasets'][0]['data'])) {
            $labels = $data['labels'];
            $values = $data['datasets'][0]['data'];
            
            for ($i = 0; $i < count($labels); $i++) {
                $csv .= $this->arrayToCsvRow([$labels[$i], $values[$i]]) . "\n";
            }
        }
        
        return $csv;
    }

    private function arrayToCsvRow(array $fields): string
    {
        return implode(',', array_map(function($value) {
            return '"' . str_replace('"', '""', (string)$value) . '"';
        }, $fields));
    }

    private function sanitizeFileName(string $filename): string
    {
        return preg_replace('/[^a-zA-Z0-9_-]/', '_', $filename);
    }

    private function exportToExcel(array $data, $report): array
    {
        $content = $this->generateExcelXml($data, $report);
        $reportName = $report->get('name') ?? 'Report';
        
        return [
            'content' => $content,
            'contentType' => 'application/vnd.ms-excel',
            'filename' => $this->sanitizeFileName($reportName) . '_' . date('Y-m-d_H-i-s') . '.xls'
        ];
    }

    private function generateExcelXml(array $data, $report): string
    {
        $reportName = htmlspecialchars($report->get('name') ?? 'Report');
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<?mso-application progid="Excel.Sheet"?>' . "\n";
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"' . "\n";
        $xml .= ' xmlns:o="urn:schemas-microsoft-com:office:office"' . "\n";
        $xml .= ' xmlns:x="urn:schemas-microsoft-com:office:excel"' . "\n";
        $xml .= ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"' . "\n";
        $xml .= ' xmlns:html="http://www.w3.org/TR/REC-html40">' . "\n";
        
        $xml .= '<Styles>' . "\n";
        $xml .= '<Style ss:ID="header">' . "\n";
        $xml .= '<Font ss:Bold="1"/>' . "\n";
        $xml .= '<Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>' . "\n";
        $xml .= '</Style>' . "\n";
        $xml .= '</Styles>' . "\n";
        
        $xml .= '<Worksheet ss:Name="' . $reportName . '">' . "\n";
        $xml .= '<Table>' . "\n";
        
        switch ($data['type']) {
            case 'list':
                $xml .= $this->generateExcelListData($data);
                break;
            case 'grid':
                $xml .= $this->generateExcelGridData($data);
                break;
            case 'chart':
                $xml .= $this->generateExcelChartData($data);
                break;
        }
        
        $xml .= '</Table>' . "\n";
        $xml .= '</Worksheet>' . "\n";
        $xml .= '</Workbook>';
        
        return $xml;
    }

    private function generateExcelListData(array $data): string
    {
        $xml = '';
        
        if (!empty($data['data'])) {
            $headers = array_keys($data['data'][0]);
            
            // Header row
            $xml .= '<Row>' . "\n";
            foreach ($headers as $header) {
                $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">' . htmlspecialchars($header) . '</Data></Cell>' . "\n";
            }
            $xml .= '</Row>' . "\n";
            
            // Data rows
            foreach ($data['data'] as $row) {
                $xml .= '<Row>' . "\n";
                foreach ($row as $value) {
                    $type = is_numeric($value) ? 'Number' : 'String';
                    $xml .= '<Cell><Data ss:Type="' . $type . '">' . htmlspecialchars((string)$value) . '</Data></Cell>' . "\n";
                }
                $xml .= '</Row>' . "\n";
            }
        }
        
        return $xml;
    }

    private function generateExcelGridData(array $data): string
    {
        $xml = '';
        
        // Header row
        $xml .= '<Row>' . "\n";
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Group</Data></Cell>' . "\n";
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Item Count</Data></Cell>' . "\n";
        $xml .= '</Row>' . "\n";
        
        if (!empty($data['data'])) {
            foreach ($data['data'] as $group => $items) {
                $xml .= '<Row>' . "\n";
                $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars($group) . '</Data></Cell>' . "\n";
                $xml .= '<Cell><Data ss:Type="Number">' . count($items) . '</Data></Cell>' . "\n";
                $xml .= '</Row>' . "\n";
            }
        }
        
        return $xml;
    }

    private function generateExcelChartData(array $data): string
    {
        $xml = '';
        
        // Header row
        $xml .= '<Row>' . "\n";
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Label</Data></Cell>' . "\n";
        $xml .= '<Cell ss:StyleID="header"><Data ss:Type="String">Value</Data></Cell>' . "\n";
        $xml .= '</Row>' . "\n";
        
        if (!empty($data['labels']) && !empty($data['datasets'][0]['data'])) {
            $labels = $data['labels'];
            $values = $data['datasets'][0]['data'];
            
            for ($i = 0; $i < count($labels); $i++) {
                $xml .= '<Row>' . "\n";
                $xml .= '<Cell><Data ss:Type="String">' . htmlspecialchars($labels[$i]) . '</Data></Cell>' . "\n";
                $xml .= '<Cell><Data ss:Type="Number">' . $values[$i] . '</Data></Cell>' . "\n";
                $xml .= '</Row>' . "\n";
            }
        }
        
        return $xml;
    }

    private function exportToPdf(array $data, $report): array
    {
        try {
            // Create dynamic HTML content for the report
            $html = $this->generateReportHtml($data, $report);
            
            // Try to generate PDF using available methods
            $pdfContents = $this->generatePdfFromHtml($html);
            
            if (empty($pdfContents)) {
                throw new Error('PDF generation resulted in empty content');
            }
            
            $reportName = $report->get('name') ?? 'Report';
            
            return [
                'content' => $pdfContents,
                'contentType' => 'application/pdf',
                'filename' => $this->sanitizeFileName($reportName) . '_' . date('Y-m-d_H-i-s') . '.pdf'
            ];
            
        } catch (\Exception $e) {
            $this->log->error('PDF generation failed for report', [
                'reportId' => $report->getId(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Fallback to HTML if PDF generation fails
            return $this->generateHtmlFallback($data, $report);
        }
    }

    private function generateReportHtml(array $data, $report): string
    {
        $reportName = htmlspecialchars($report->get('name') ?? 'Report');
        $reportType = htmlspecialchars($report->get('type') ?? 'List');
        $targetEntity = htmlspecialchars($report->get('targetEntity') ?? 'Unknown');
        
        $html = '<!DOCTYPE html>' . "\n";
        $html .= '<html><head>' . "\n";
        $html .= '<meta charset="UTF-8">' . "\n";
        $html .= '<title>' . $reportName . '</title>' . "\n";
        $html .= '<style>' . "\n";
        $html .= 'body { font-family: "DejaVu Sans", Arial, sans-serif; margin: 20px; font-size: 10px; line-height: 1.4; }' . "\n";
        $html .= 'h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; font-size: 16px; margin-bottom: 20px; }' . "\n";
        $html .= 'h2 { color: #555; font-size: 12px; margin-bottom: 10px; }' . "\n";
        $html .= '.report-meta { color: #666; font-size: 9px; margin-bottom: 20px; background: #f8f9fa; padding: 10px; border-radius: 4px; }' . "\n";
        $html .= 'table { border-collapse: collapse; width: 100%; margin-top: 15px; page-break-inside: auto; }' . "\n";
        $html .= 'th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; vertical-align: top; }' . "\n";
        $html .= 'th { background-color: #f5f5f5; font-weight: bold; font-size: 9px; }' . "\n";
        $html .= 'td { font-size: 9px; }' . "\n";
        $html .= 'tr:nth-child(even) { background-color: #f9f9f9; }' . "\n";
        $html .= 'tr { page-break-inside: avoid; }' . "\n";
        $html .= '.chart-summary { margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 4px; }' . "\n";
        $html .= '.total-summary { font-weight: bold; margin-top: 10px; padding: 8px; background: #e8f5e8; }' . "\n";
        $html .= '</style>' . "\n";
        $html .= '</head><body>' . "\n";
        
        $html .= '<h1>' . $reportName . '</h1>' . "\n";
        $html .= '<div class="report-meta">' . "\n";
        $html .= '<strong>Report Type:</strong> ' . $reportType . '<br>' . "\n";
        $html .= '<strong>Target Entity:</strong> ' . $targetEntity . '<br>' . "\n";
        $html .= '<strong>Generated on:</strong> ' . date('Y-m-d H:i:s') . '<br>' . "\n";
        $html .= '<strong>Total Records:</strong> ' . ($data['total'] ?? 0) . "\n";
        $html .= '</div>' . "\n";
        
        switch ($data['type']) {
            case 'list':
                $html .= $this->generatePdfListTable($data);
                break;
            case 'grid':
                $html .= $this->generatePdfGridTable($data);
                break;
            case 'chart':
                $html .= $this->generatePdfChartTable($data);
                break;
        }
        
        $html .= '</body></html>';
        
        return $html;
    }
    
    private function generatePdfFromHtml(string $html): string
    {
        // Try to use EspoCRM's PDF service first
        try {
            $pdfService = $this->injectableFactory->create(PdfService::class);
            
            // Create a temporary template for PDF generation
            $template = $this->entityManager->getEntity('Template');
            if ($template) {
                $template->set([
                    'name' => 'TempReportTemplate_' . uniqid(),
                    'body' => $html,
                    'entityType' => 'Report',
                    'header' => '',
                    'footer' => '',
                    'printFooter' => false
                ]);
                
                // Save the temporary template
                $this->entityManager->saveEntity($template);
                
                try {
                    // Create a temporary report entity
                    $tempReport = $this->entityManager->getEntity('Report');
                    $tempReport->set('id', 'temp-report-' . uniqid());
                    $this->entityManager->saveEntity($tempReport);
                    
                    // Generate PDF using EspoCRM's service
                    $pdfData = $pdfService->generate('Report', $tempReport->getId(), $template->getId());
                    $pdfContents = $pdfData->getString();
                    
                    // Clean up temporary entities
                    $this->entityManager->removeEntity($template);
                    $this->entityManager->removeEntity($tempReport);
                    
                    if (!empty($pdfContents)) {
                        return $pdfContents;
                    }
                    
                } catch (\Exception $serviceError) {
                    // Clean up on error
                    try {
                        $this->entityManager->removeEntity($template);
                        if (isset($tempReport)) {
                            $this->entityManager->removeEntity($tempReport);
                        }
                    } catch (\Exception $cleanupError) {
                        // Ignore cleanup errors
                    }
                    
                    throw $serviceError;
                }
            }
            
            // If EspoCRM service fails, try direct PDF libraries
            return $this->generatePdfWithAvailableLibrary($html);
            
        } catch (\Exception $e) {
            // Fall back to direct PDF generation
            return $this->generatePdfWithAvailableLibrary($html);
        }
    }
    
    private function generatePdfWithAvailableLibrary(string $html): string
    {
        // Check if TCPDF is available (common in EspoCRM installations)
        if (class_exists('\TCPDF')) {
            return $this->generatePdfWithTcpdf($html);
        }
        
        // Check if Dompdf is available
        if (class_exists('\Dompdf\Dompdf')) {
            return $this->generatePdfWithDompdf($html);
        }
        
        // Check for other PDF libraries that might be available
        if (class_exists('\Mpdf\Mpdf')) {
            return $this->generatePdfWithMpdf($html);
        }
        
        // If no PDF library is available, throw an error
        throw new Error('No PDF generation library available. Please install TCPDF, Dompdf, or mPDF.');
    }
    
    private function generatePdfWithTcpdf(string $html): string
    {
        $pdf = new \TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
        
        // Set document information
        $pdf->SetCreator('EspoCRM Report Module');
        $pdf->SetAuthor('viaCRM Module');
        $pdf->SetTitle('Report');
        
        // Set margins
        $pdf->SetMargins(15, 20, 15);
        $pdf->SetHeaderMargin(5);
        $pdf->SetFooterMargin(10);
        
        // Set auto page breaks
        $pdf->SetAutoPageBreak(true, 20);
        
        // Add a page
        $pdf->AddPage();
        
        // Set font
        $pdf->SetFont('dejavusans', '', 9);
        
        // Output the HTML content
        $pdf->writeHTML($html, true, false, true, false, '');
        
        // Return PDF content as string
        return $pdf->Output('', 'S');
    }
    
    private function generatePdfWithDompdf(string $html): string
    {
        $dompdf = new \Dompdf\Dompdf();
        $dompdf->loadHtml($html);
        
        // Set paper size and orientation
        $dompdf->setPaper('A4', 'portrait');
        
        // Render the HTML as PDF
        $dompdf->render();
        
        // Return PDF content as string
        return $dompdf->output();
    }
    
    private function generatePdfWithMpdf(string $html): string
    {
        $mpdf = new \Mpdf\Mpdf([
            'format' => 'A4',
            'orientation' => 'P',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 16,
            'margin_bottom' => 16,
            'margin_header' => 9,
            'margin_footer' => 9
        ]);
        
        $mpdf->WriteHTML($html);
        
        // Return PDF content as string
        return $mpdf->Output('', 'S');
    }
    
    private function generateHtmlFallback(array $data, $report): array
    {
        // Fallback to HTML if PDF generation fails
        $html = $this->generateReportHtml($data, $report);
        $reportName = $report->get('name') ?? 'Report';
        
        return [
            'content' => $html,
            'contentType' => 'text/html',
            'filename' => $this->sanitizeFileName($reportName) . '_' . date('Y-m-d_H-i-s') . '.html'
        ];
    }

    private function generatePdfListTable(array $data): string
    {
        $html = '<h2>List Report Data</h2>' . "\n";
        
        if (!empty($data['data'])) {
            $headers = array_keys($data['data'][0]);
            
            $html .= '<table>' . "\n";
            
            // Header row
            $html .= '<thead><tr>' . "\n";
            foreach ($headers as $header) {
                $html .= '<th>' . htmlspecialchars(ucfirst(str_replace('_', ' ', $header))) . '</th>' . "\n";
            }
            $html .= '</tr></thead>' . "\n";
            
            // Data rows
            $html .= '<tbody>' . "\n";
            foreach ($data['data'] as $row) {
                $html .= '<tr>' . "\n";
                foreach ($row as $value) {
                    $cellValue = $value;
                    if (is_array($value)) {
                        $cellValue = isset($value['name']) ? $value['name'] : json_encode($value);
                    }
                    $html .= '<td>' . htmlspecialchars((string)$cellValue) . '</td>' . "\n";
                }
                $html .= '</tr>' . "\n";
            }
            $html .= '</tbody>' . "\n";
            $html .= '</table>' . "\n";
            
            // Add summary
            $html .= '<div class="total-summary">Total Records: ' . count($data['data']) . '</div>' . "\n";
        } else {
            $html .= '<p>No data available for this report.</p>' . "\n";
        }
        
        return $html;
    }

    private function generatePdfGridTable(array $data): string
    {
        $groupBy = $data['groupBy'] ?? 'Group';
        $html = '<h2>Grid Report - Grouped by ' . htmlspecialchars(ucfirst(str_replace('_', ' ', $groupBy))) . '</h2>' . "\n";
        
        if (!empty($data['data'])) {
            $html .= '<table>' . "\n";
            $html .= '<thead><tr><th>' . htmlspecialchars(ucfirst(str_replace('_', ' ', $groupBy))) . '</th><th>Count</th></tr></thead>' . "\n";
            $html .= '<tbody>' . "\n";
            
            $totalItems = 0;
            foreach ($data['data'] as $group => $items) {
                $count = count($items);
                $totalItems += $count;
                $html .= '<tr>' . "\n";
                $html .= '<td>' . htmlspecialchars($group) . '</td>' . "\n";
                $html .= '<td>' . $count . '</td>' . "\n";
                $html .= '</tr>' . "\n";
            }
            
            $html .= '</tbody></table>' . "\n";
            $html .= '<div class="total-summary">Total Groups: ' . count($data['data']) . ' | Total Items: ' . $totalItems . '</div>' . "\n";
        } else {
            $html .= '<p>No data available for this report.</p>' . "\n";
        }
        
        return $html;
    }

    private function generatePdfChartTable(array $data): string
    {
        $chartType = $data['chartType'] ?? 'Chart';
        $groupBy = $data['groupBy'] ?? 'Group';
        $html = '<h2>' . htmlspecialchars($chartType) . ' Chart Report - ' . htmlspecialchars(ucfirst(str_replace('_', ' ', $groupBy))) . '</h2>' . "\n";
        
        if (!empty($data['labels']) && !empty($data['datasets'][0]['data'])) {
            $labels = $data['labels'];
            $values = $data['datasets'][0]['data'];
            $datasetLabel = $data['datasets'][0]['label'] ?? 'Value';
            
            // Chart summary
            $html .= '<div class="chart-summary">' . "\n";
            $html .= '<strong>Chart Type:</strong> ' . htmlspecialchars($chartType) . '<br>' . "\n";
            $html .= '<strong>Data Points:</strong> ' . count($labels) . '<br>' . "\n";
            $html .= '<strong>Total:</strong> ' . array_sum($values) . "\n";
            $html .= '</div>' . "\n";
            
            $html .= '<table>' . "\n";
            $html .= '<thead><tr><th>' . htmlspecialchars(ucfirst(str_replace('_', ' ', $groupBy))) . '</th><th>' . htmlspecialchars($datasetLabel) . '</th><th>Percentage</th></tr></thead>' . "\n";
            $html .= '<tbody>' . "\n";
            
            $total = array_sum($values);
            for ($i = 0; $i < count($labels); $i++) {
                $percentage = $total > 0 ? round(($values[$i] / $total) * 100, 1) : 0;
                $html .= '<tr>' . "\n";
                $html .= '<td>' . htmlspecialchars($labels[$i]) . '</td>' . "\n";
                $html .= '<td>' . $values[$i] . '</td>' . "\n";
                $html .= '<td>' . $percentage . '%</td>' . "\n";
                $html .= '</tr>' . "\n";
            }
            
            $html .= '</tbody></table>' . "\n";
            $html .= '<div class="total-summary">Total: ' . $total . ' items across ' . count($labels) . ' categories</div>' . "\n";
        } else {
            $html .= '<p>No chart data available for this report.</p>' . "\n";
        }
        
        return $html;
    }
}
