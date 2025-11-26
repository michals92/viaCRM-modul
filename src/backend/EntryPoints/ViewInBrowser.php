<?php

namespace Espo\Modules\Viacrm\EntryPoints;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\EntryPoint\EntryPoint;
use Espo\Core\EntryPoint\Traits\NoAuth;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Utils\Client\ActionRenderer;
use Espo\Core\Utils\Crypt;
use Espo\Core\Utils\Json;
use Espo\Modules\Viacrm\Tools\EmailTemplate\ViewInBrowser\Data as ViewInBrowserData;
use Espo\ORM\EntityManager;
use Espo\Tools\EmailTemplate\Data as EmailTemplateData;
use Espo\Tools\EmailTemplate\Params as EmailTemplateParams;
use Espo\Tools\EmailTemplate\Processor as EmailTemplateProcessor;
use JsonException;
use RuntimeException;

class ViewInBrowser implements EntryPoint {
	use NoAuth;

	public function __construct(
		private readonly Crypt $crypt,
		private readonly EntityManager $entityManager,
		private readonly ActionRenderer $actionRenderer,
		private readonly EmailTemplateProcessor $emailTemplateProcessor,
	) {}

	/**
	 * @throws BadRequest
	 * @throws NotFound
	 */
	public function run(Request $request, Response $response): void {
		$encryptedData = $request->getQueryParam('data');

		if (!$encryptedData) {
			throw new BadRequest();
		}

		try {
			$decryptedData = Json::decode($this->crypt->decrypt($encryptedData));
		} catch (RuntimeException | JsonException $e) {
			throw new BadRequest();
		}

		$data = ViewInBrowserData::create()
		    ->withEmailTemplateId($decryptedData->emailTemplateId ?? null)
		    ->withParentId($decryptedData->parentId ?? null)
		    ->withParentType($decryptedData->parentType ?? null);

		$bodyContent = null;

		if ($data->getEmailTemplateId() && $data->getParentId() && $data->getParentType()) {
			$bodyContent = $this->handleEmailTemplate($data->getEmailTemplateId(), $data->getParentId(), $data->getParentType());
		}

		if (!$bodyContent) {
			throw new BadRequest();
		}

		$params = new ActionRenderer\Params('viacrm:controllers/view-in-browser', 'viewEmail', [
		    'emailBody' => $bodyContent,
		]);

		$this->actionRenderer->write($response, $params);
	}

	/**
	 * @throws NotFound
	 */
	private function handleEmailTemplate(string $templateId, string $parentId, string $parentType): string {
		$em = $this->entityManager;
		$templateEntity = $em->getEntityById('EmailTemplate', $templateId);
		$parentEntity = $em->getEntityById($parentType, $parentId);

		if (!$templateEntity || !$parentEntity) {
			throw new NotFound();
		}

		return $this->emailTemplateProcessor->process(
			$templateEntity,
			EmailTemplateParams::create(),
			EmailTemplateData::create()->withParent($parentEntity),
		)->getBody();
	}
}
