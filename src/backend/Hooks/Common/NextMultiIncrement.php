<?php

namespace Espo\Modules\Autocrm\Hooks\Common;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Modules\Autocrm\Classes\FieldProcessing\MultiIncrement\BeforeSaveProcessor as Processor;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements BeforeSave<Entity>
 */
class NextMultiIncrement implements BeforeSave {

	public function __construct(
		private Processor $processor
	) {}

	public function beforeSave(Entity $entity, SaveOptions $options): void {
		/** @var \Espo\Core\ORM\Entity $coreEntity */
		$coreEntity = $entity;
		$this->processor->process($coreEntity, $options->toAssoc());
	}

}
