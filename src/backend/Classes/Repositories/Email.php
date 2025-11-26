<?php

namespace Espo\Modules\Viacrm\Classes\Repositories;

use Espo\Core\Di;
use Espo\Entities\Email as EmailEntity;
use Espo\Modules\Viacrm\Classes\Abstract\Entities\EmailAction;
use Espo\Modules\Viacrm\Entities\EmailFilter;
use ReflectionException;

class Email extends \Espo\Repositories\Email implements Di\MetadataAware, Di\InjectableFactoryAware {
	use Di\EmailFilterManagerSetter;
	use Di\MetadataSetter;
	use Di\InjectableFactorySetter;

	/** @var array<string, class-string<EmailAction>>|null */
	private array|null $actionClassNameMap = null;

	/**
	 * @param  \Espo\Modules\Viacrm\Entities\Email $entity
	 * @throws ReflectionException
	 */
	public function applyUsersFilters(EmailEntity $entity): void {
		foreach ($entity->getUsers()->getIdList() as $userId) {
			if (
				$entity->getStatus() === EmailEntity::STATUS_SENT &&
				$entity->getSentBy()?->getId() === $userId
			) {
				continue;
			}

			/** @var EmailFilter|null $filter */
			$filter = $this->emailFilterManager->getMatchingFilter($entity, $userId);

			if (!$filter) {
				continue;
			}

			if ($filterAction = $filter->getAction()) {
				match ($filterAction) {
					EmailFilter::ACTION_SKIP => $entity->setUserColumnInTrash($userId, true),
					EmailFilter::ACTION_MOVE_TO_FOLDER => $filter->getEmailFolderId()
						? $entity->setUserColumnFolderId($userId, $filter->getEmailFolderId())
						: null,
					default => $this->handleAdditionalActions($entity, $filter, $userId)
				};
			}

			if ($filter->markAsRead()) {
				$entity->setUserColumnIsRead($userId, true);
			}

			if ($filter->skipNotification()) {
				$entity->setUserSkipNotification($userId);
			}
		}
	}

	/**
	 * @param  \Espo\Modules\Viacrm\Entities\Email $email
	 * @throws ReflectionException
	 */
	private function handleAdditionalActions(EmailEntity $email, EmailFilter $filter, ?string $userId = null): void {
		$actionClassNameMap = $this->getActionClassNameMap();
		$actionName = $filter->getAction();

		if (isset($actionClassNameMap[$actionName])) {
			$className = $actionClassNameMap[$actionName];
			/** @var EmailAction $obj */
			$obj = $this->injectableFactory->create($className);
			$obj->process($email, $filter, $userId);
		} else if ($actionName === 'None') {
			return;
		} else {
			$GLOBALS['log']->error("handleAdditionalActions unknown emailFilter action:$actionName in emailFilter:" . $filter->getId());
		}
	}

	/**
	 * @return array<string, class-string<EmailAction>>
	 */
	public function getActionClassNameMap(): array {
		return $this->actionClassNameMap ??= $this->metadata->get(['app', 'email', 'actionClassNameMap'], []);
	}
}
