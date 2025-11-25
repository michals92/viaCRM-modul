<?php

namespace Espo\Modules\Viacrm\Entities;

use Espo\ORM\Query\InsertBuilder;
use Espo\ORM\Query\Part\Expression;

class Alert extends \Espo\Core\Templates\Entities\Base {

	public const ENTITY_TYPE = 'Alert';
	
	public const LINK_USER_NAME = 'AlertUser';
	public const LINK_USER_COLUMN_ACTIVE = 'alert_active';

	public const STATUS_ACTIVE = 'active';
	public const STATUS_DRAFT = 'draft';
	public const STATUS_RESOLVED = 'resolved';
	public const STATUS_ARCHIVED = 'archived';

	public function setMessage(?string $message): self {
		$this->set('message', $message);

		return $this;
	}

	public function setIconClass(?string $iconClassName): self {
		$this->set('iconClass', $iconClassName);

		return $this;
	}

	public function getStatus(): ?string {
		return $this->get('status');
	}

	public function toggleUser(string $userId): bool {
		$this->toggleForUsers([$userId]);

		return false;
	}

	/**
	 * Activates the alert for a specific user.
	 * 
	 * @param  string $userId The ID of the user
	 * @return void
	 */
	public function activateForUser(string $userId): void {
		assert($this->entityManager !== null);

		$usersRelation = $this->entityManager
			->getRelation($this, 'users');

		if (!$usersRelation->isRelatedById($userId)) {
			$usersRelation->relateById($userId);
		}

		$usersRelation->updateColumnsById($userId, [self::LINK_USER_COLUMN_ACTIVE => true]);
	}

	/**
	 * Deactivates the alert for a specific user.
	 * 
	 * @param  string $userId The ID of the user
	 * @return void
	 */
	public function deactivateForUser(string $userId): void {
		assert($this->entityManager !== null);

		$usersRelation = $this->entityManager
			->getRelation($this, 'users');

		if (!$usersRelation->isRelatedById($userId)) {
			$usersRelation->relateById($userId);
		}

		$usersRelation->updateColumnsById($userId, [self::LINK_USER_COLUMN_ACTIVE => false]);
	}

	/**
     * @param array<string> $userIds
     */
	public function activateForUsers(array $userIds): void {
		assert($this->entityManager !== null);

		$alertId = $this->getId();
		$rows = array_map(function ($userId) use ($alertId) {
			return ['alertId' => $alertId, 'userId' => $userId, 'alertActive' => true];
		}, $userIds);

		$query = InsertBuilder::create()
		    ->into('AlertUser')
		    ->columns(['alertId', 'userId', 'alertActive'])
		    ->values($rows)
		    ->updateSet(['alertActive' => true])
		    ->build();

		$this->entityManager->getQueryExecutor()->execute($query);
	}

	/**
     * @param array<string> $userIds
     */
	public function deactivateForUsers(array $userIds): void {
		assert($this->entityManager !== null);

		$alertId = $this->getId();
		$rows = array_map(function ($userId) use ($alertId) {
			return ['alertId' => $alertId, 'userId' => $userId, 'alertActive' => false];
		}, $userIds);

		$query = InsertBuilder::create()
		    ->into('AlertUser')
		    ->columns(['alertId', 'userId', 'alertActive'])
		    ->values($rows)
		    ->updateSet(['alertActive' => false])
		    ->build();

		$this->entityManager->getQueryExecutor()->execute($query);
	}

	/**
	 * Toggles the alert status for multiple users.
	 * If a user has the alert active, it will be deactivated.
	 * If a user doesn't have the alert active, it will be activated.
	 * 
	 * @param  array $userIds Array of user IDs
	 * @return void
	 */
	/**
	 * Toggles the alert status for multiple users.
	 * If a user has the alert active, it will be deactivated.
	 * If a user doesn't have the alert active, it will be activated.
	 * 
	 * IMPORTANT: This method is used in hooks to activate alerts for users.
	 * When called from hooks, it should only activate alerts for new users,
	 * not reactivate alerts for users who have already dismissed them.
	 * 
	 * @param  array<string> $userIds Array of user IDs
	 * @return void
	 */
	public function toggleForUsers(array $userIds): void {
		assert($this->entityManager !== null);

		if (empty($userIds)) {
			return;
		}
	    
		$alertId = $this->getId();
		$rows = array_map(function ($userId) use ($alertId) {
			return ['alertId' => $alertId, 'userId' => $userId, 'alertActive' => true];
		}, $userIds);

		$query = InsertBuilder::create()
		    ->into('AlertUser')
		    ->columns(['alertId', 'userId', 'alertActive'])
		    ->values($rows)
			// @phpstan-ignore-next-line PHPStan detects an error here, because we extend the functionality of updateSet in viaCRM
		    ->updateSet([
		        'alertActive' => Expression::not(Expression::column('alertActive'))
		    ])
		    ->build();
			
		$this->entityManager->getQueryExecutor()->execute($query);
	}

}
