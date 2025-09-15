<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Controllers\Record;
use Espo\Core\Api\Request;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Entities\Attachment;
use Espo\Core\FileStorage\Manager as FileStorageManager;
use Espo\Tools\Pdf\Service as PdfService;

class Order extends Record
{
    public function postActionGeneratePdfWithAttachment(Request $request): array
    {
        $data = $request->getParsedBody();
        
        $entityId = $data->entityId ?? null;
        $templateId = $data->templateId ?? null;
        
        if (!$entityId || !$templateId) {
            throw new BadRequest('Missing required parameters');
        }
        
        // Check permissions
        $entity = $this->entityManager->getEntityById('Order', $entityId);
        if (!$entity) {
            throw new NotFound('Order not found');
        }
        
        if (!$this->acl->check($entity, 'read')) {
            throw new Forbidden();
        }
        
        // Get template
        $template = $this->entityManager->getEntityById('Template', $templateId);
        if (!$template) {
            throw new NotFound('Template not found');
        }
        
        if (!$this->acl->check($template, 'read')) {
            throw new Forbidden('No access to template');
        }
        
        try {
            // Use EspoCRM's built-in PDF service
            $pdfService = $this->injectableFactory->create(PdfService::class);
            $pdfData = $pdfService->generate('Order', $entityId, $templateId);
            $pdfContents = $pdfData->getString();
            
            if (!$pdfContents) {
                throw new BadRequest('Generated PDF is empty');
            }
            
            // Create unique filename
            $entityName = $entity->get('name') ?: $entityId;
            $fileName = preg_replace('/[^a-zA-Z0-9_\-.]/', '_', $entityName) . '_' . date('Y-m-d_H-i-s') . '.pdf';
            
            // Create attachment entity
            $attachment = $this->entityManager
                ->getRDBRepositoryByClass(Attachment::class)
                ->getNew();
                
            $attachment->set([
                'name' => $fileName,
                'type' => 'application/pdf',
                'size' => strlen($pdfContents),
                'role' => 'Attachment',
                'relatedType' => 'Email',
                'field' => 'attachments'
            ]);
            
            // Save attachment to database
            $this->entityManager->saveEntity($attachment);
            
            // Save PDF contents to file storage
            $fileStorageManager = $this->injectableFactory->create(FileStorageManager::class);
            $fileStorageManager->putContents($attachment, $pdfContents);
            
            return [
                'id' => $attachment->getId(),
                'name' => $attachment->get('name'),
                'size' => $attachment->get('size')
            ];
            
        } catch (\Exception $e) {
            $this->log->error('Failed to generate PDF for Order', [
                'entityId' => $entityId,
                'templateId' => $templateId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new BadRequest('Failed to generate PDF: ' . $e->getMessage());
        }
    }
}
