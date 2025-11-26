<?php

namespace Espo\Modules\Viacrm\Hooks\Common;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Modules\Viacrm\Classes\FieldProcessing\MultiIncrement\BeforeSaveProcessor as Processor;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements BeforeSave<Entity>
 */
class NextMultiIncrement implements BeforeSave
{
	public static int $order = 9;

	public function __construct(
		private Processor $processor
	) {
	}

	public function beforeSave(Entity $entity, SaveOptions $options): void
	{
		/** @var \Espo\Core\ORM\Entity $coreEntity */
		$coreEntity = $entity;
		$this->processor->process($coreEntity, $options->toAssoc());
	}
}
