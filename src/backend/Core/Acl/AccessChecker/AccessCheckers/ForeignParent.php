<?php

namespace Espo\Modules\Viacrm\Core\Acl\AccessChecker\AccessCheckers;

use Espo\Core\Acl\AccessEntityCreateChecker;
use Espo\Core\Acl\AccessEntityDeleteChecker;
use Espo\Core\Acl\AccessEntityEditChecker;
use Espo\Core\Acl\AccessEntityReadChecker;
use Espo\Core\Acl\AccessEntityStreamChecker;
use Espo\Core\Acl\DefaultAccessChecker;
use Espo\Core\Acl\ScopeData;
use Espo\Core\Acl\Traits\DefaultAccessCheckerDependency;
use Espo\Core\Utils\Metadata;
use Espo\Entities\User;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use LogicException;

/**
 * Access is determined by access to any of the foreign entities specified in the 'links' array.
 * If any of the related entities pass ACL check, access is granted.
 *
 * @implements AccessEntityCreateChecker<Entity>
 * @implements AccessEntityReadChecker<Entity>
 * @implements AccessEntityEditChecker<Entity>
 * @implements AccessEntityDeleteChecker<Entity>
 * @implements AccessEntityStreamChecker<Entity>
 */
class ForeignParent implements
	AccessEntityCreateChecker,
	AccessEntityReadChecker,
	AccessEntityEditChecker,
	AccessEntityDeleteChecker,
	AccessEntityStreamChecker
{
	use DefaultAccessCheckerDependency;

	public function __construct(
		private Metadata $metadata,
		DefaultAccessChecker $defaultAccessChecker,
		private EntityManager $entityManager
	) {
		$this->defaultAccessChecker = $defaultAccessChecker;
	}

	/**
	 * Get foreign entities related to the entity through the links defined in aclDefs.
	 * Returns an array of entities, which can be empty if no related entities are found.
	 */
	private function getForeignEntity(Entity $entity): ?Entity
	{
		$entityType = $entity->getEntityType();
		$link = $this->metadata->get(['aclDefs', $entityType, 'link']);

		if (!$link) {
			throw new LogicException("No `link` in aclDefs for {$entityType}.");
		}

		if ($entity->isNew()) {
			$foreignEntityType = $entity->get($link . 'Type');

			if (!$foreignEntityType) {
				return null;
			}

			/** @var ?string $id */
			$id = $entity->get($link . 'Id');

			if (!$id) {
				return null;
			}

			return $this->entityManager->getEntityById($foreignEntityType, $id);
		}

		return $this->entityManager->getRelation($entity, $link)->findOne();
	}

	public function checkEntityCreate(User $user, Entity $entity, ScopeData $data): bool
	{
		$foreign = $this->getForeignEntity($entity);

		if (!$foreign) {
			return false;
		}

		return $this->defaultAccessChecker->checkEntityCreate($user, $foreign, $data);
	}

	public function checkEntityRead(User $user, Entity $entity, ScopeData $data): bool
	{
		$foreign = $this->getForeignEntity($entity);

		if (!$foreign) {
			return false;
		}

		return $this->defaultAccessChecker->checkEntityRead($user, $foreign, $data);
	}

	public function checkEntityEdit(User $user, Entity $entity, ScopeData $data): bool
	{
		$foreign = $this->getForeignEntity($entity);

		if (!$foreign) {
			return false;
		}

		return $this->defaultAccessChecker->checkEntityEdit($user, $foreign, $data);
	}

	public function checkEntityDelete(User $user, Entity $entity, ScopeData $data): bool
	{
		$foreign = $this->getForeignEntity($entity);

		if (!$foreign) {
			if ($user->isAdmin()) {
				return true;
			}

			return false;
		}

		return $this->defaultAccessChecker->checkEntityDelete($user, $foreign, $data);
	}

	public function checkEntityStream(User $user, Entity $entity, ScopeData $data): bool
	{
		$foreign = $this->getForeignEntity($entity);

		if (!$foreign) {
			return false;
		}

		return $this->defaultAccessChecker->checkEntityStream($user, $foreign, $data);
	}
}
