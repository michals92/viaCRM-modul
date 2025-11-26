<?php

namespace Espo\Modules\Viacrm\Hooks\RecordRecurrence;

use Espo\Core\Exceptions\Error;
use Espo\Core\Hook\Hook\AfterSave;
use Espo\Modules\Viacrm\Entities\RecordRecurrence;
use Espo\Modules\Viacrm\Services\RecordRecurrence as Service;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements AfterSave<RecordRecurrence>
 */
readonly class Process implements AfterSave {
	public function __construct(
		private Service $service,
		private EntityManager $entityManager,
	) {}

	public function afterSave(Entity $entity, SaveOptions $options): void {
		if (!$entity->isNew() || $entity->get('status') !== 'Draft') {
			return;
		}

		try {
			$this->service->processRecurringRecords($entity);
		} catch (Error|\Exception $e) {
			$GLOBALS['log']->error('Record Recurrence: After save error: ' . $e->getMessage());
		} finally {
			if ($entity->get('status') === 'Draft') {
				$entity->set('status', 'Active'); // changing Draft to Active will trigger the job preparation
				$this->entityManager->saveEntity($entity, ['skipHooks' => true]);
			}
		}
	}
}