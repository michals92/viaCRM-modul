<?php

namespace Espo\Modules\Viacrm\Hooks\RecordRecurrence;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Error\Body as ErrorBody;
use Espo\Core\Exceptions\ErrorSilent;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\ForbiddenSilent;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Core\Record\ServiceContainer as RecordServiceContainer;
use Espo\Modules\Viacrm\Entities\RecordRecurrence;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements BeforeSave<RecordRecurrence>
 */
class DuplicateData implements BeforeSave
{
	public static int $order = 9;

	public function __construct(
		private RecordServiceContainer $recordServiceContainer,
	) {
	}

	/**
	 * @throws BadRequest
	 * @throws Forbidden
	 * @throws ForbiddenSilent
	 * @throws NotFound
	 * @throws Error
	 */
	public function beforeSave(Entity $entity, SaveOptions $options): void
	{
		if (!$entity->isNew()) {
			return;
		}

		$data = $entity->get('data');
		$id = $data->id ?? null;

		if (!$id) {
			return;
		}

		$recordService = $this->recordServiceContainer->get($entity->get('entityType'));
		$duplicateAttributes = $recordService->getDuplicateAttributes($id);

		if (!($duplicateAttributes->dateStart ?? null)) {
			throw ErrorSilent::createWithBody(
				'Record must have a start date.',
				ErrorBody::create()
					->withMessageTranslation('cronExprInvalid', 'RecordRecurrence')
					->encode(),
			);
		}

		$entity->set('data', $duplicateAttributes);
	}
}
