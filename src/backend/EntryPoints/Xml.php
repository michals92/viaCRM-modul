<?php

namespace Espo\Modules\Viacrm\EntryPoints;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\EntryPoint\EntryPoint;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\ORM\EntityManager;
use Espo\Modules\Viacrm\Entities\XmlTemplate;
use Espo\Modules\Viacrm\Tools\Xml\Service as XmlService;

class Xml implements EntryPoint {
	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly XmlService $xmlService
	) {}

	public function run(Request $request, Response $response): void {
		$entityId = $request->getQueryParam('entityId');
		$entityType = $request->getQueryParam('entityType');
		$templateId = $request->getQueryParam('templateId');

		if (!$entityId || !$entityType || !$templateId) {
			throw new BadRequest();
		}

		$entity = $this->entityManager->getEntityById($entityType, $entityId);
		/** @var ?XmlTemplate $template */
		$template = $this->entityManager->getEntityById(XmlTemplate::ENTITY_TYPE, $templateId);

		if (!$entity || !$template) {
			throw new NotFound();
		}

		$contents = $this->xmlService->generate($entityType, $entityId, $templateId);

		$fileName = $contents->getFileName();

		$response
		    ->setHeader('Content-Type', 'application/xml')
		    ->setHeader('Cache-Control', 'private, must-revalidate, post-check=0, pre-check=0, max-age=1')
		    ->setHeader('Pragma', 'public')
		    ->setHeader('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT')
		    ->setHeader('Last-Modified', gmdate('D, d M Y H:i:s') . ' GMT')
		    ->setHeader('Content-Disposition', 'inline; filename="' . $fileName . '"');

		if (!$request->getServerParam('HTTP_ACCEPT_ENCODING')) {
			$response->setHeader('Content-Length', (string)$contents->getStream()->getSize());
		}

		$response->writeBody($contents->getStream());
	}
}
