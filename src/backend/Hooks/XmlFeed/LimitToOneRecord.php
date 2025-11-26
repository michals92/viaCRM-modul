<?php

namespace Espo\Modules\Viacrm\Hooks\XmlFeed;

use Espo\Core\Exceptions\Error\Body as ErrorBody;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Core\ORM\EntityManager;
use Espo\Modules\Viacrm\Entities\XmlFeed;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements BeforeSave<XmlFeed>
 */
class LimitToOneRecord implements BeforeSave {
	public function __construct(
		private readonly EntityManager $entityManager
	) {}

	/**
	 * @param Entity      $entity  The XmlFeed entity
	 * @param SaveOptions $options
	 */
	public function beforeSave(Entity $entity, SaveOptions $options): void {
		if (!$entity->isNew()) {
			return;
		}

		$count = $this->entityManager
		    ->getRDBRepository(XmlFeed::ENTITY_TYPE)
		    ->where(['deleted' => false])
		    ->count();

		if ($count > 0) {
			throw Forbidden::createWithBody(
				'Only one XmlFeed record allowed',
				ErrorBody::create()->withMessageTranslation('limitOneRecord', 'XmlFeed')
			);
		}
	}
}
