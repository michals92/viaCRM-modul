<?php

namespace Espo\Modules\Autocrm\Classes\EmailPdf;

use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\ForbiddenSilent;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Field\LinkParent;
use Espo\Core\FileStorage\Manager as FileStorageManager;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Record\ServiceContainer;
use Espo\Core\Utils\Util;
use Espo\Entities\Attachment;
use Espo\Entities\Template;
use Espo\Tools\Pdf\Params as PdfParams;
use Espo\Tools\Pdf\Service as PdfService;
use Exception;
use stdClass;

class DefaultAttributeProvider implements AttributeProvider {

	public function __construct(
		private readonly ServiceContainer $serviceContainer,
		private readonly EntityManager $entityManager,
		private readonly FileStorageManager $fileStorageManager,
		private readonly PdfService $pdfService
	) {}

	/**
	 * Gets attributes for email PDF generation.
	 *
	 * @param  string          $entityType
	 * @param  string          $id
	 * @param  string          $templateId
	 * @throws Forbidden
	 * @throws NotFound
	 * @throws ForbiddenSilent
	 * @throws Error
	 * @return stdClass
	 */
	public function getAttributes(string $entityType, string $id, string $templateId): stdClass {
		try {
			$service = $this->serviceContainer->get($entityType);

			if (method_exists($service, 'getAttributesForEmail')) {
				// If the service has getAttributesForEmail, use it.
				/** @disregard */
				return $service->getAttributesForEmail($id, $templateId);
			}
		} catch (\Exception) {
		}

		// Fallback to default implementation
		return $this->getDefaultAttributesForEmail($entityType, $id, $templateId);
	}

	/**
	 * Default implementation of getAttributesForEmail.
	 *
	 * @param  string          $entityType
	 * @param  string          $id
	 * @param  string          $templateId
	 * @throws Forbidden
	 * @throws NotFound
	 * @throws ForbiddenSilent
	 * @throws Error
	 * @return stdClass
	 */
	private function getDefaultAttributesForEmail(string $entityType, string $id, string $templateId): stdClass {
		$attributes = [];

		// Fetch the entity and template
		$entity = $this->entityManager->getEntityById($entityType, $id);
		$template = $this->entityManager->getEntityById(Template::ENTITY_TYPE, $templateId);

		if (!$entity || !$template) {
			throw new NotFound('Entity or Template not found.');
		}

		// TODO: implement some logic for selecting where to get the 'to' email address from

		// Catch when the relation doesn't exist
		try {
			$account = $this->entityManager
			    ->getRelation($entity, 'account')
			    ->findOne();

			$attributes['to'] = $account?->get('emailAddress');
		} catch (Exception) {
		}

		$attributes['name'] = $entity->get('name');

		// Generate PDF
		$params = PdfParams::create()->withAcl();

		$contents = $this->pdfService->generate(
			$entity->getEntityType(),
			$entity->getId(),
			$template->getId(),
			$params
		);

		$fileName = Util::sanitizeFileName($entity->get('name')) . '.pdf';

		/** @var Attachment $attachment */
		$attachment = $this->entityManager->getNewEntity(Attachment::ENTITY_TYPE);
		$attachment
		    ->setName($fileName)
		    ->setType('application/pdf')
		    ->setSize($contents->getStream()->getSize())
		    ->setRelated(LinkParent::create($entity->getEntityType(), $entity->getId()))
		    ->setRole(Attachment::ROLE_ATTACHMENT);

		$this->entityManager->saveEntity($attachment);

		// Store the PDF stream
		$this->fileStorageManager->putStream($attachment, $contents->getStream());

		$attributes['attachmentsIds'] = [$attachment->getId()];
		$attributes['attachmentsNames'] = [
		    $attachment->getId() => $attachment->get('name'),
		];

		return (object)$attributes;
	}

}
