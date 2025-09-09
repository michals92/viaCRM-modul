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
        try {
            $report = $this->getEntity($id);
            
            if (!$report) {
                throw new NotFound("Report not found");
            }

            if ($report->get('status') !== 'Active') {
                throw new BadRequest("Report is not active");
            }

            $targetEntity = $report->get('targetEntity');
            if (!$targetEntity) {
                throw new BadRequest("Target entity not specified");
            }

            $type = $report->get('type') ?? 'List';
            
            switch ($type) {
                case 'List':
                    return $this->runListReport($report);
                case 'Grid':
                    return $this->runGridReport($report);
                case 'Chart':
                    return $this->runChartReport($report);
                default:
                    throw new BadRequest("Invalid report type");
            }
        } catch (\Exception $e) {
            // Log error and return a basic response
            error_log("Report error: " . $e->getMessage());
            return [
                'type' => 'list',
                'data' => [],
                'total' => 0,
                'error' => $e->getMessage()
            ];
        }
    }

    private function runListReport($report)
    {
        try {
            $targetEntity = $report->get('targetEntity');
            $repository = $this->entityManager->getRepository($targetEntity);
            $collection = $repository->find();
            
            $result = [];
            foreach ($collection as $entity) {
                $result[] = $entity->getValueMap();
            }
            
            return [
                'type' => 'list',
                'data' => $result,
                'total' => count($result)
            ];
        } catch (\Exception $e) {
            // Return empty result on error
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
            $targetEntity = $report->get('targetEntity');
            $groupBy = $report->get('groupBy');
            $chartType = $report->get('chartType') ?? 'Bar';
            
            if (!$groupBy) {
                throw new BadRequest("Group By field is required for chart reports");
            }
            
            $repository = $this->entityManager->getRepository($targetEntity);
            $collection = $repository->find();
            
            $chartData = [];
            $labels = [];
            $values = [];
            
            foreach ($collection as $entity) {
                $groupValue = $entity->get($groupBy) ?? 'Unknown';
                if (!isset($chartData[$groupValue])) {
                    $chartData[$groupValue] = 0;
                }
                $chartData[$groupValue]++;
            }
            
            foreach ($chartData as $label => $count) {
                $labels[] = $label;
                $values[] = $count;
            }
            
            return [
                'type' => 'chart',
                'chartType' => $chartType,
                'labels' => $labels,
                'datasets' => [
                    [
                        'label' => ucfirst($groupBy),
                        'data' => $values,
                        'backgroundColor' => $this->generateColors(count($labels))
                    ]
                ],
                'total' => array_sum($values)
            ];
        } catch (\Exception $e) {
            return [
                'type' => 'chart',
                'chartType' => 'Bar',
                'labels' => [],
                'datasets' => [],
                'total' => 0,
                'error' => $e->getMessage()
            ];
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
}
