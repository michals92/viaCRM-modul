<?php

namespace Espo\Modules\Autocrm\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Metadata;
use Espo\Core\Utils\Util;
use Espo\Entities\Attachment;
use Espo\Modules\Autocrm\Tools\ZipStream\Creator as ZipStreamCreator;
use Espo\Repositories\Attachment as AttachmentRepository;
use ZipStream\ZipStream;

class ZipAttachments implements Action {

	private AttachmentRepository $attachmentRepository;

	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly Metadata $metadata,
		private readonly ZipStreamCreator $zipStreamCreator
	) {
		// AttachmentRepository can't be injected directly because the constructor needs an 'entityType' parameter

		/** @var AttachmentRepository $repo */
		$repo = $this->entityManager->getRepository(Attachment::ENTITY_TYPE);
        
		$this->attachmentRepository = $repo;
	}

	public function process(Request $request): Response {
		$ids = $request->getQueryParam('ids');
		$field = $request->getQueryParam('field');
		$entityType = $request->getQueryParam('entityType');

		if (!$ids) {
			throw new BadRequest('Missing required parameter: ids');
		}
		if (!$field) {
			throw new BadRequest('Missing required parameter: field');
		}
		if (!$entityType) {
			throw new BadRequest('Missing required parameter: entityType');
		}

		$ids = explode(',', $ids);

		$fieldType = $this->metadata->get(['entityDefs', $entityType, 'fields', $field, 'type']);

		if ($fieldType !== 'file' && $fieldType !== 'attachmentMultiple') {
			throw new BadRequest('Invalid field type');
		}

		$zipFileName = 'attachments.zip';

		$response = ResponseComposer::empty()
		    ->setHeader('Content-Type', 'application/zip')
		    ->setHeader('Content-Disposition', 'attachment; filename="' . $zipFileName . '"');

		$resource = fopen('php://temp', 'r+');

		if ($resource === false) {
			throw new \RuntimeException('Failed to create temporary resource');
		}

		$zip = $this->zipStreamCreator->create($zipFileName, $resource);

		$attachmentFound = false;

		foreach ($ids as $id) {
			$entity = $this->entityManager->getEntityById($entityType, $id);

			if (!$entity) {
				continue;
			}

			if ($fieldType === 'file') {
				$attachment = $entity->get($field);

				if ($attachment) {
					$this->addAttachmentToZip($zip, $attachment);
					$attachmentFound = true;
				}
			} elseif ($fieldType === 'attachmentMultiple') {
				$attachments = $entity->get($field);

				if ($attachments) {
					foreach ($attachments as $attachment) {
						$this->addAttachmentToZip($zip, $attachment);
						$attachmentFound = true;
					}
				}
			}
		}

		if (!$attachmentFound) {
			throw new BadRequest('No attachments found in any of the entity fields');
		}

		$zip->finish();

		rewind($resource);
		$zipContent = stream_get_contents($resource);
		fclose($resource);

		if ($zipContent === false) {
			throw new \RuntimeException('Failed to get zip content');
		}

		return $response
		    ->setHeader('Content-Length', (string) strlen($zipContent))
		    ->writeBody($zipContent);
	}

	private function addAttachmentToZip(ZipStream $zip, Attachment $attachment): void {
		$contents = $this->attachmentRepository->getContents($attachment);
		$fileName = $attachment->get('name');
		$fileName = Util::sanitizeFileName($fileName);

		$zip->addFile($fileName, $contents);
	}

}
