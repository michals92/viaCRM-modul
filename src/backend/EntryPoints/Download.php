<?php

namespace Espo\Modules\Viacrm\EntryPoints;

use Espo\Core\Acl;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\EntryPoint\EntryPoint;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFoundSilent;
use Espo\Core\FileStorage\Manager as FileStorageManager;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Metadata;
use Espo\Entities\Attachment as AttachmentEntity;

class Download implements EntryPoint {
	public function __construct(
		protected FileStorageManager $fileStorageManager,
		protected Acl $acl,
		protected EntityManager $entityManager,
		protected Metadata $metadata
	) {}

	public function run(Request $request, Response $response): void {
		$id = $request->getQueryParam('id');

		if (!$id) {
			throw new BadRequest('No id.');
		}

		/** @var ?AttachmentEntity $attachment */
		$attachment = $this->entityManager->getEntityById(AttachmentEntity::ENTITY_TYPE, $id);

		if (!$attachment) {
			throw new NotFoundSilent('Attachment not found.');
		}

		if (!$this->acl->checkEntity($attachment)) {
			throw new Forbidden('No access to attachment.');
		}

		if ($attachment->isBeingUploaded()) {
			throw new Forbidden('Attachment is being uploaded.');
		}

		$stream = $this->fileStorageManager->getStream($attachment);

		$outputFileName = str_replace('"', '\\"', $attachment->getName() ?? '');

		$type = $attachment->getType();

		$disposition = 'attachment';

		/** @var string[] $inlineMimeTypeList */
		$inlineMimeTypeList = $this->metadata->get(['app', 'file', 'inlineMimeTypeList'], []);

		$forceDownload = $request->getQueryParam('forceDownload');
        
		if (!$forceDownload) {
			if (in_array($type, $inlineMimeTypeList)) {
				$disposition = 'inline';

				$response->setHeader('Content-Security-Policy', "default-src 'self'");
			}
		}

		$response->setHeader('Content-Description', 'File Transfer');

		if ($type) {
			$response->setHeader('Content-Type', $type);
		}

		$size = $stream->getSize() ?? $this->fileStorageManager->getSize($attachment);

		$response
		    ->setHeader('Content-Disposition', $disposition . ';filename="' . $outputFileName . '"')
		    ->setHeader('Expires', '0')
		    ->setHeader('Cache-Control', 'must-revalidate')
		    ->setHeader('Pragma', 'public')
		    ->setHeader('Content-Length', (string) $size)
		    ->setBody($stream);
	}
}
