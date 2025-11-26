<?php

namespace Espo\Modules\Viacrm\Tools\EmailTemplate;

use Espo\Core\Di;
use Espo\Entities\EmailTemplate;
use Espo\Modules\Viacrm\Tools\EmailTemplate\ViewInBrowser\Data as ViewInBrowserData;
use Espo\Modules\Viacrm\Tools\EmailTemplate\ViewInBrowser\Processor as ViewInBrowserProcessor;
use Espo\Tools\EmailTemplate\Data as EmailTemplateData;
use Espo\Tools\EmailTemplate\Params as EmailTemplateParams;
use Espo\Tools\EmailTemplate\Result;

class Processor extends \Espo\Tools\EmailTemplate\Processor implements Di\EntityManagerAware, Di\InjectableFactoryAware
{
	use Di\EntityManagerSetter;
	use Di\InjectableFactorySetter;

	private ?ViewInBrowserProcessor $viewInBrowserProcess = null;

	public function process(EmailTemplate $template, EmailTemplateParams $params, EmailTemplateData $data): Result
	{
		$result = parent::process($template, $params, $data);

		$parent = $data->getParent();
		$parentId = $parent?->getId() ?? $data->getParentId();
		$parentType = $parent?->getEntityType() ?? $data->getParentType();

		if (!$parentId || !$parentType) {
			return $result;
		}

		$data = ViewInBrowserData::create()
			->withEmailTemplateId($template->getId())
			->withParentId($parentId)
			->withParentType($parentType);

		$body = $this->getViewInBrowserProcessor()->process($result->getBody(), $data);

		return new Result(
			$result->getSubject(),
			$body,
			$template->isHtml(),
			$result->getAttachmentList(),
		);
	}

	private function getViewInBrowserProcessor(): ViewInBrowserProcessor
	{
		return $this->viewInBrowserProcess ??= $this->injectableFactory->create(ViewInBrowserProcessor::class);
	}
}
