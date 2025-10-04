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

class Invoice extends Record
{
    public function postActionGeneratePdfWithAttachment(Request $request): array
    {
        $data = $request->getParsedBody();
        
        $entityId = $data->entityId ?? null;
        $templateId = $data->templateId ?? null;
        
        if (!$entityId || !$templateId) {
            throw new BadRequest('Missing required parameters: entityId and templateId');
        }
        
        // Check permissions
        $entity = $this->entityManager->getEntityById('Invoice', $entityId);
        if (!$entity) {
            throw new NotFound('Invoice not found');
        }
        
        if (!$this->acl->check($entity, 'read')) {
            throw new Forbidden('No read access to Invoice entity');
        }
        
        // Check template permissions
        $template = $this->entityManager->getEntityById('Template', $templateId);
        if (!$template) {
            throw new NotFound('Template not found');
        }
        
        if (!$this->acl->check($template, 'read')) {
            throw new Forbidden('No read access to Template entity');
        }
        
        try {
            // Use EspoCRM's built-in PDF service instead of HTTP requests
            /** @var PdfService $pdfService */
            $pdfService = $this->injectableFactory->create(PdfService::class);
            
            // Generate PDF contents directly using the PDF service
            $pdfData = $pdfService->generate('Invoice', $entityId, $templateId);
            $pdfContents = $pdfData->getString();
            
            if (empty($pdfContents)) {
                throw new BadRequest('PDF generation resulted in empty content');
            }
            
            // Create unique filename based on entity name and timestamp
            $entityName = $entity->get('name') ?? $entity->get('id');
            $safeFileName = preg_replace('/[^a-zA-Z0-9_\-.]/', '_', $entityName);
            $fileName = $safeFileName . '_' . date('Y-m-d_H-i-s') . '.pdf';
            
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
            
            // Save attachment to database first to get ID
            $this->entityManager->saveEntity($attachment);
            
            // Save PDF contents to file storage using proper service
            /** @var FileStorageManager $fileStorageManager */
            $fileStorageManager = $this->injectableFactory->create(FileStorageManager::class);
            $fileStorageManager->putContents($attachment, $pdfContents);
            
            return [
                'id' => $attachment->getId(),
                'name' => $attachment->get('name'),
                'size' => $attachment->get('size'),
                'type' => $attachment->get('type')
            ];
            
        } catch (\Exception $e) {
            // Log error for debugging
            $GLOBALS['log']->error('PDF Generation Failed for Invoice ' . $entityId . ': ' . $e->getMessage(), [
                'entityId' => $entityId,
                'templateId' => $templateId,
                'trace' => $e->getTraceAsString()
            ]);
            
            throw new BadRequest('Failed to generate PDF: ' . $e->getMessage());
        }
    }
}
