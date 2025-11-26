<?php

namespace Espo\Modules\Viacrm\Repositories;

use Cron\CronExpression;
use Espo\Core\Di;
use Espo\Core\Exceptions\Error;
use Espo\ORM\Entity;

class RecordRecurrence extends \Espo\Core\Templates\Repositories\Base implements Di\RecordServiceContainerAware {
	use Di\RecordServiceContainerSetter;

	/**
	 * @throws Error
	 */
	protected function beforeSave(Entity $entity, array $options = []): void {
		if (!CronExpression::isValidExpression($entity->get('scheduling'))) {
			throw new Error('Invalid scheduling cron rule');
		}

		parent::beforeSave($entity, $options);
	}
}