<?php

namespace Espo\Modules\Viacrm\Classes\TemplateHelpers;

use Espo\Core\Htmlizer\Helper;
use Espo\Core\Htmlizer\Helper\Data;
use Espo\Core\Htmlizer\Helper\Result;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Config;
use LogicException;

class PublicDownloadLink implements Helper {

	public function __construct(
		private readonly Config $config,
		private readonly EntityManager $entityManager,
	) {}

	public function render(Data $data): Result {
		$attachmentField = $data->getArgumentList()[0];
		$escape = $data->getArgumentList()[1] ?? false;

		$attachmentId = $data->getContext()[$attachmentField . 'Id'];

		if (empty($attachmentId)) {
			return Result::createEmpty();
		}

		$publicDownloadToken = $this
		    ->entityManager
		    ->getDefs()
		    ->getEntity($data->getContext()['__entityType'])
		    ->getField($attachmentField)
		    ->getParam('publicDownloadToken');

		if (empty($publicDownloadToken)) {
			return throw new LogicException('publicDownloadToken is not set for the field ' . $attachmentField);
		}

		$url = rtrim($this->config->get('siteUrl'), '/');

		$url .= '?entryPoint=publicDownload&id=' . $attachmentId . '&token=' . $publicDownloadToken;

		if ($escape) {
			$url = htmlentities($url);
		}

		return Result::createSafeString($url);
	}

}
