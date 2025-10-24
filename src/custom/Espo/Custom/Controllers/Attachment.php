<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Exceptions\Forbidden;

class Attachment extends \Espo\Controllers\Attachment
{
    public function getActionDownloadFieldZip(Request $request, Response $response): void
    {
        $entityType = $request->getQueryParam('entityType');
        $entityId = $request->getQueryParam('entityId');
        $field = $request->getQueryParam('field');

        if (!$entityType || !$entityId || !$field) {
            throw new BadRequest('Missing required parameters: entityType, entityId, field');
        }

        // Get entity using RecordService to load attachment fields
        $service = $this->recordServiceContainer->get($entityType);
        $entity = $service->getEntity($entityId);

        if (!$entity) {
            throw new NotFound("Entity {$entityType} with ID {$entityId} not found.");
        }

        // Check ACL
        if (!$this->acl->checkEntity($entity, 'read')) {
            throw new Forbidden("No read access to {$entityType} entity.");
        }

        // Get attachment IDs from field
        $attachmentIds = $entity->get($field . 'Ids');

        if (!$attachmentIds || !is_array($attachmentIds) || count($attachmentIds) === 0) {
            throw new NotFound('No attachments found in this field.');
        }

        // Create ZIP
        $zipPath = tempnam(sys_get_temp_dir(), 'field_attachments_');
        $zip = new \ZipArchive();

        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            throw new \Espo\Core\Exceptions\Error('Could not create ZIP archive.');
        }

        $fileStorageManager = $this->injectableFactory->create(\Espo\Core\FileStorage\Manager::class);
        $tempFiles = [];

        foreach ($attachmentIds as $attachmentId) {
            $attachment = $this->entityManager->getEntityById('Attachment', $attachmentId);

            if (!$attachment) {
                continue;
            }

            // Check access to attachment
            if (!$this->acl->checkEntity($attachment)) {
                continue;
            }

            // Get file contents
            $contents = $fileStorageManager->getContents($attachment);

            if ($contents === null) {
                continue;
            }

            // Create temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'attach_');
            file_put_contents($tempFile, $contents);
            $tempFiles[] = $tempFile;

            // Add to ZIP
            $fileName = $attachment->get('name') ?? 'attachment_' . $attachmentId;
            $zip->addFile($tempFile, $fileName);
        }

        $zip->close();

        // Clean up temporary files
        foreach ($tempFiles as $tempFile) {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }

        // Read ZIP contents
        $zipContents = file_get_contents($zipPath);

        // Clean up ZIP file
        if (file_exists($zipPath)) {
            unlink($zipPath);
        }

        // Generate filename
        $entityName = $entity->get('name') ?? $entityId;
        $safeEntityName = preg_replace('/[^a-zA-Z0-9_\-.]/', '_', $entityName);
        $safeFieldName = preg_replace('/[^a-zA-Z0-9_\-.]/', '_', $field);
        $fileName = $safeFieldName . '_' . date('Y-m-d') . '.zip';

        $response->setHeader('Content-Type', 'application/zip');
        $response->setHeader('Content-Disposition', 'attachment; filename="' . $fileName . '"');
        $response->writeBody($zipContents);
    }
}