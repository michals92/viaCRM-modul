<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;

class EasyEmailEditor extends \Espo\Core\Controllers\Record
{
    public function postActionSaveTemplate(Request $request, Response $response): bool
    {
        $data = $request->getParsedBody();
        $entityManager = $this->getEntityManager();
        
        // Create new template if templateId is null or 'new'
        if (empty($data->templateId) || $data->templateId === 'new') {
            $template = $entityManager->createEntity('EmailTemplate', [
                'name' => $data->subject ?? 'New Email Template',
                'subject' => $data->subject ?? '',
                'body' => $data->html ?? '',
                'bodyMjml' => $data->mjml ?? '',
                'useEasyEmailEditor' => true
            ]);
        } else {
            // Update existing template
            $template = $entityManager->getEntity('EmailTemplate', $data->templateId);
            
            if (!$template) {
                throw new NotFound('Template not found');
            }

            // Save MJML data
            if (isset($data->mjml)) {
                $template->set('bodyMjml', $data->mjml);
            }
            
            // Save HTML body
            if (isset($data->html)) {
                $template->set('body', $data->html);
            }
            
            // Save subject
            if (isset($data->subject)) {
                $template->set('subject', $data->subject);
            }

            // Mark as using Easy Email Editor
            $template->set('useEasyEmailEditor', true);
            
            $entityManager->saveEntity($template);
        }
        
        $response->writeBody(json_encode([
            'success' => true,
            'id' => $template->getId()
        ]));
        
        return true;
    }

    public function postActionSaveEmail(Request $request, Response $response): bool
    {
        $data = $request->getParsedBody();
        
        $entityManager = $this->getEntityManager();
        
        // Create or update email entity
        if (!empty($data->emailId)) {
            $email = $entityManager->getEntity('Email', $data->emailId);
            if (!$email) {
                throw new NotFound();
            }
        } else {
            $email = $entityManager->createEntity('Email', [
                'status' => 'Draft'
            ]);
        }

        // Save email data
        if (isset($data->html)) {
            $email->set('body', $data->html);
            $email->set('isHtml', true);
        }
        
        if (isset($data->subject)) {
            $email->set('subject', $data->subject);
        }
        
        if (isset($data->mjml)) {
            // Store MJML in custom field if needed
            $email->set('bodyMjml', $data->mjml);
        }
        
        $entityManager->saveEntity($email);
        
        $response->writeBody(json_encode([
            'success' => true,
            'id' => $email->getId()
        ]));
        
        return true;
    }

    public function getActionLoadTemplate(Request $request, Response $response): bool
    {
        $templateId = $request->getRouteParam('id');
        
        if (!$templateId) {
            throw new BadRequest('Template ID is required');
        }

        $entityManager = $this->getEntityManager();
        $template = $entityManager->getEntity('EmailTemplate', $templateId);
        
        if (!$template) {
            throw new NotFound();
        }

        $responseData = [
            'id' => $template->getId(),
            'name' => $template->get('name'),
            'subject' => $template->get('subject'),
            'body' => $template->get('body'),
            'bodyMjml' => $template->get('bodyMjml'),
            'useEasyEmailEditor' => $template->get('useEasyEmailEditor')
        ];
        
        $response->writeBody(json_encode($responseData));
        
        return true;
    }

    public function postActionUploadImage(Request $request, Response $response): bool
    {
        $attachment = $request->getBodyContents();
        
        if (!$attachment) {
            throw new BadRequest('No file uploaded');
        }

        // Process image upload
        $entityManager = $this->getEntityManager();
        $attachmentEntity = $entityManager->createEntity('Attachment', [
            'name' => $request->getHeader('X-File-Name') ?? 'image.jpg',
            'type' => $request->getHeader('Content-Type') ?? 'image/jpeg',
            'contents' => $attachment,
            'role' => 'EasyEmailImage',
            'relatedType' => 'EmailTemplate',
            'field' => 'attachments'
        ]);

        $url = $this->getConfig()->get('siteUrl') . '/?entryPoint=download&id=' . $attachmentEntity->getId();
        
        $response->writeBody(json_encode([
            'url' => $url,
            'name' => $attachmentEntity->get('name')
        ]));
        
        return true;
    }
}