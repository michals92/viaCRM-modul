<?php

namespace Espo\Modules\Autocrm\Core\FieldProcessing\EmailAddress;

use Espo\Core\FieldProcessing\Loader\Params as LoaderParams;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Config;
use Espo\ORM\Defs as OrmDefs;
use Espo\ORM\Entity;

class ListLoader extends \Espo\Core\FieldProcessing\EmailAddress\Loader {

	public function __construct(
		OrmDefs $ormDefs,
		EntityManager $entityManager,
		private readonly Config $config
	) {
		parent::__construct($ormDefs, $entityManager);
	}

	public function process(Entity $entity, LoaderParams $params): void {
		$disableAccountLinkToEmail = $this->config->get('disableAccountLinkToEmail', false);

		if ($disableAccountLinkToEmail) {
			return;
		}

		parent::process($entity, $params);
	}

}
