<?php

namespace Espo\Modules\Viacrm\Tools\User;

use Espo\Core\Acl;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Record\Collection;
use Espo\Core\Select\SearchParams;
use Espo\Entities\User;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Entity;

/** @disregard */
ReflectionUtil::createClassIfNotExists(
	\Espo\Tools\User\UsersAccessService::class,
	<<<'PHP'
    namespace Espo\Tools\User;
    
    class UsersAccessService {}
    PHP
);

class UsersAccessService extends \Espo\Tools\User\UsersAccessService {

	/**
	 * @throws Forbidden
	 * @throws BadRequest
	 * @return Collection<User>
	 */
	public function get(Entity $entity, SearchParams $params): Collection {
		$collection = parent::get($entity, $params);

		foreach ($collection->getCollection() as $user) {
			$this->loadAdditionalRecordAccessLevels($entity, $user);
		}

		return $collection;
	}

	private function loadAdditionalRecordAccessLevels(Entity $entity, User $user): void {
		$actions = [
		    'print'
		];

		$levels = $user->get('recordAccessLevels');

		foreach ($actions as $action) {
			$level = null;

			try {
				$level = ReflectionUtil::getClassProperty(parent::class, $this, 'aclManager')->checkEntity($user, $entity, $action);
			} catch (Acl\Exceptions\NotImplemented) {
			}

			$levels->$action = $level;
		}

		$user->set('recordAccessLevels', $levels);
	}

}