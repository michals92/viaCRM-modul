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
class ForeignEither implements
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
	 *
	 * @return Entity[]
	 */
	private function getForeignEntities(Entity $entity): array
	{
		$entityType = $entity->getEntityType();
		$links = $this->metadata->get(['aclDefs', $entityType, 'links']);

		if (!$links || !is_array($links)) {
			throw new LogicException("No `links` array in aclDefs for {$entityType}.");
		}

		$foreignEntities = [];

		foreach ($links as $link) {
			if ($entity->isNew()) {
				$foreignEntityType = $this->entityManager
					->getDefs()
					->getEntity($entityType)
					->getRelation($link)
					->getForeignEntityType();

				/** @var ?string $id */
				$id = $entity->get($link . 'Id');

				if ($id) {
					$foreignEntity = $this->entityManager->getEntityById($foreignEntityType, $id);

					if ($foreignEntity) {
						$foreignEntities[] = $foreignEntity;
					}
				}
			} else {
				$foreignEntity = $this->entityManager
					->getRelation($entity, $link)
					->findOne();

				if ($foreignEntity) {
					$foreignEntities[] = $foreignEntity;
				}
			}
		}

		return $foreignEntities;
	}

	public function checkEntityCreate(User $user, Entity $entity, ScopeData $data): bool
	{
		$foreignEntities = $this->getForeignEntities($entity);

		if (empty($foreignEntities)) {
			return false;
		}

		// Return true if any of the related entities pass the check
		foreach ($foreignEntities as $foreign) {
			if ($this->defaultAccessChecker->checkEntityCreate($user, $foreign, $data)) {
				return true;
			}
		}

		return false;
	}

	public function checkEntityRead(User $user, Entity $entity, ScopeData $data): bool
	{
		$foreignEntities = $this->getForeignEntities($entity);

		if (empty($foreignEntities)) {
			return false;
		}

		// Return true if any of the related entities pass the check
		foreach ($foreignEntities as $foreign) {
			if ($this->defaultAccessChecker->checkEntityRead($user, $foreign, $data)) {
				return true;
			}
		}

		return false;
	}

	public function checkEntityEdit(User $user, Entity $entity, ScopeData $data): bool
	{
		$foreignEntities = $this->getForeignEntities($entity);

		if (empty($foreignEntities)) {
			return false;
		}

		// Return true if any of the related entities pass the check
		foreach ($foreignEntities as $foreign) {
			if ($this->defaultAccessChecker->checkEntityEdit($user, $foreign, $data)) {
				return true;
			}
		}

		return false;
	}

	public function checkEntityDelete(User $user, Entity $entity, ScopeData $data): bool
	{
		$foreignEntities = $this->getForeignEntities($entity);

		if (empty($foreignEntities)) {
			if ($user->isAdmin()) {
				return true;
			}

			return false;
		}

		// Return true if any of the related entities pass the check
		foreach ($foreignEntities as $foreign) {
			if ($this->defaultAccessChecker->checkEntityDelete($user, $foreign, $data)) {
				return true;
			}
		}

		return false;
	}

	public function checkEntityStream(User $user, Entity $entity, ScopeData $data): bool
	{
		$foreignEntities = $this->getForeignEntities($entity);

		if (empty($foreignEntities)) {
			return false;
		}

		// Return true if any of the related entities pass the check
		foreach ($foreignEntities as $foreign) {
			if ($this->defaultAccessChecker->checkEntityStream($user, $foreign, $data)) {
				return true;
			}
		}

		return false;
	}
}
