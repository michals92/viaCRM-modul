<?php

namespace Espo\Modules\Viacrm\Core\FieldProcessing\Relation;

use Espo\Core\FieldProcessing\Relation\LinkMultipleSaver as BaseLinkMultipleSaver;
use Espo\Core\FieldProcessing\Saver\Params as SaverParams;
use Espo\Core\ORM\Entity as CoreEntity;
use Espo\Core\ORM\EntityManager;
use Espo\ORM\Entity;

class LinkMultipleSaver extends BaseLinkMultipleSaver
{
	public function __construct(
		private readonly EntityManager $entityManager,
	) {
		parent::__construct($entityManager);
	}

	/**
	 * @param CoreEntity $entity
	 */
	public function process(Entity $entity, string $name, SaverParams $params): void
	{
		$defs = $this->entityManager->getDefs()->getEntity($entity->getEntityType());

		$recordListEnabled = $defs->tryGetField($name)?->getParam('recordListEnabled') ?? false;

		if (!$recordListEnabled) {
			parent::process($entity, $name, $params);
		}
	}
}
