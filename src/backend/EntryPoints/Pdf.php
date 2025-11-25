<?php

namespace Espo\Modules\Viacrm\EntryPoints;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Di;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Utils\Util;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;

class Pdf extends \Espo\EntryPoints\Pdf implements Di\MetadataAware {
	use Di\MetadataSetter;

	public function run(Request $request, Response $response): void {
		$entityId = $request->getQueryParam('entityId');
		$entityType = $request->getQueryParam('entityType');

		if (!$entityId || !$entityType) {
			throw new BadRequest('No entityId or entityType or templateId.');
		}

		$entity = ReflectionUtil::getClassProperty(parent::class, $this, 'entityManager')->getEntityById($entityType, $entityId) ?? throw new NotFound('Record not found.');

		parent::run($request, $response);

		$pdfNameField = $this->metadata->get(['clientDefs', $entityType, 'pdfNameField']);

		if ($pdfNameField) {
			$fileName = Util::sanitizeFileName($entity->get($pdfNameField) ?? 'unnamed') . '.pdf';

			$response->setHeader('Content-Disposition', 'inline; filename="' . basename($fileName) . '"');
		}
	}

}