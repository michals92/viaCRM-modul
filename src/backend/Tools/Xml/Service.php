<?php

namespace Espo\Modules\Viacrm\Tools\Xml;

use Espo\Core\Acl;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Htmlizer\TemplateRenderer;
use Espo\Core\Htmlizer\TemplateRendererFactory;
use Espo\Core\Record\ServiceContainer;
use Espo\Modules\Viacrm\Entities\XmlTemplate as XmlTemplateEntity;
use Espo\Modules\Viacrm\Tools\Xml\Contents as XmlContents;
use Espo\Modules\Viacrm\Tools\Xml\Data\DataLoaderManager;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Tools\Pdf\Data as PdfData;
use Espo\Tools\Pdf\Params as PdfParams;

class Service {
	protected TemplateRenderer $templateRenderer;

	public function __construct(
		protected readonly EntityManager $entityManager,
		protected readonly ServiceContainer $serviceContainer,
		protected readonly DataLoaderManager $dataLoaderManager,
		protected readonly Acl $acl,
		protected readonly TemplateRendererFactory $templateRendererFactory
	) {
		$this->templateRenderer = $this->templateRendererFactory->create();
	}

	/**
	 * @throws Forbidden
	 * @throws NotFound
	 * @throws Error
	 */
	public function generate(
		string $entityType,
		string $id,
		string $templateId,
		?PdfParams $params = null,
		?PdfData $data = null
	): XmlContents {
		$params = $params ?? PdfParams::create()->withAcl();

		$applyAcl = $params->applyAcl();

		$entity = $this->entityManager->getEntityById($entityType, $id);

		if (!$entity) {
			throw new NotFound('Record not found.');
		}

		/** @var ?XmlTemplateEntity $template */
		$template = $this->entityManager->getEntityById(XmlTemplateEntity::ENTITY_TYPE, $templateId);

		if (!$template) {
			throw new NotFound('Template not found.');
		}

		if ($applyAcl && !$this->acl->checkEntityRead($entity)) {
			throw new Forbidden('No access to record.');
		}

		if ($applyAcl && !$this->acl->checkEntityRead($template)) {
			throw new Forbidden('No access to template.');
		}

		$service = $this->serviceContainer->get($entityType);

		$service->loadAdditionalFields($entity);

		if (method_exists($service, 'loadAdditionalFieldsForXml')) {
			// For bc.
			/** @disregard */
			$service->loadAdditionalFieldsForXml($entity);
		}

		if ($template->getTargetEntityType() !== $entityType) {
			throw new Error('Not matching entity types.');
		}

		$data = $this->dataLoaderManager->load($entity, $params, $data);

		$title = '';
		if ($template->get('title')) {
			$title = $this->renderInternal($entity, $template->get('title'), $data);
		}

		$contents = $this->renderInternal($entity, $template->get('body') ?? '', $data);

		return new XmlContents($title, $contents);
	}

	protected function renderInternal(Entity $entity, string $template, PdfData $data): string {
		return $this
		    ->templateRenderer
		    ->setSkipInlineAttachmentHandling()
		    ->setEntity($entity)
		    ->setTemplate($template)
		    ->setData($data->getAdditionalTemplateData())
		    ->render();
	}
}
