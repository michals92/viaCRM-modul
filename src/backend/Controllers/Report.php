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

            // Simple hardcoded field list for each entity to avoid API complexity
            $entityFields = [
                'Absence' => [
                    ['name' => 'name', 'type' => 'varchar', 'label' => 'Name'],
                    ['name' => 'status', 'type' => 'enum', 'label' => 'Status'],
                    ['name' => 'startDate', 'type' => 'date', 'label' => 'Start Date'],
                    ['name' => 'endDate', 'type' => 'date', 'label' => 'End Date'],
                    ['name' => 'type', 'type' => 'enum', 'label' => 'Type'],
                    ['name' => 'createdAt', 'type' => 'datetime', 'label' => 'Created At']
                ],
                'Attendance' => [
                    ['name' => 'name', 'type' => 'varchar', 'label' => 'Name'],
                    ['name' => 'date', 'type' => 'date', 'label' => 'Date'],
                    ['name' => 'checkIn', 'type' => 'datetime', 'label' => 'Check In'],
                    ['name' => 'checkOut', 'type' => 'datetime', 'label' => 'Check Out'],
                    ['name' => 'status', 'type' => 'enum', 'label' => 'Status']
                ],
                'Hr' => [
                    ['name' => 'name', 'type' => 'varchar', 'label' => 'Name'],
                    ['name' => 'department', 'type' => 'varchar', 'label' => 'Department'],
                    ['name' => 'position', 'type' => 'varchar', 'label' => 'Position'],
                    ['name' => 'status', 'type' => 'enum', 'label' => 'Status']
                ],
                'Order' => [
                    ['name' => 'name', 'type' => 'varchar', 'label' => 'Name'],
                    ['name' => 'number', 'type' => 'varchar', 'label' => 'Number'],
                    ['name' => 'status', 'type' => 'enum', 'label' => 'Status'],
                    ['name' => 'amount', 'type' => 'currency', 'label' => 'Amount'],
                    ['name' => 'dateOrdered', 'type' => 'date', 'label' => 'Date Ordered']
                ],
                'Offer' => [
                    ['name' => 'name', 'type' => 'varchar', 'label' => 'Name'],
                    ['name' => 'number', 'type' => 'varchar', 'label' => 'Number'],
                    ['name' => 'status', 'type' => 'enum', 'label' => 'Status'],
                    ['name' => 'amount', 'type' => 'currency', 'label' => 'Amount'],
                    ['name' => 'validUntil', 'type' => 'date', 'label' => 'Valid Until']
                ],
                'ProductsItems' => [
                    ['name' => 'name', 'type' => 'varchar', 'label' => 'Name'],
                    ['name' => 'sku', 'type' => 'varchar', 'label' => 'SKU'],
                    ['name' => 'price', 'type' => 'currency', 'label' => 'Price'],
                    ['name' => 'quantity', 'type' => 'int', 'label' => 'Quantity'],
                    ['name' => 'status', 'type' => 'enum', 'label' => 'Status']
                ],
                'User' => [
                    ['name' => 'userName', 'type' => 'varchar', 'label' => 'User Name'],
                    ['name' => 'firstName', 'type' => 'varchar', 'label' => 'First Name'],
                    ['name' => 'lastName', 'type' => 'varchar', 'label' => 'Last Name'],
                    ['name' => 'emailAddress', 'type' => 'email', 'label' => 'Email Address'],
                    ['name' => 'isActive', 'type' => 'bool', 'label' => 'Is Active']
                ],
                'Account' => [
                    ['name' => 'name', 'type' => 'varchar', 'label' => 'Name'],
                    ['name' => 'type', 'type' => 'enum', 'label' => 'Type'],
                    ['name' => 'industry', 'type' => 'enum', 'label' => 'Industry'],
                    ['name' => 'website', 'type' => 'url', 'label' => 'Website'],
                    ['name' => 'emailAddress', 'type' => 'email', 'label' => 'Email Address']
                ],
                'Contact' => [
                    ['name' => 'name', 'type' => 'personName', 'label' => 'Name'],
                    ['name' => 'emailAddress', 'type' => 'email', 'label' => 'Email Address'],
                    ['name' => 'phoneNumber', 'type' => 'phone', 'label' => 'Phone Number'],
                    ['name' => 'title', 'type' => 'varchar', 'label' => 'Title'],
                    ['name' => 'accountName', 'type' => 'varchar', 'label' => 'Account']
                ]
            ];

            $fields = $entityFields[$entityType] ?? [];
            $response->writeBody(json_encode($fields));
        } catch (\Exception $e) {
            $response->setStatus(500);
            $response->writeBody(json_encode(['error' => $e->getMessage()]));
        }
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
