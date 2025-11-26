<?php

namespace Espo\Modules\Viacrm\Core\FieldProcessing\Reminder;

use Espo\Core\Field\DateTime;
use Espo\Core\FieldProcessing\Saver\Params as SaverParams;
use Espo\Core\InjectableFactory;
use Espo\Core\ORM\Entity as CoreEntity;
use Espo\Core\Utils\Config;
use Espo\Entities\User;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Entity;
use ReflectionClass;

class Saver extends \Espo\Core\FieldProcessing\Reminder\Saver {
	public function __construct(
		InjectableFactory $injectableFactory,
		private readonly Config $config
	) {
		$parentConstructorArgs = ReflectionUtil::callMethod(
			$injectableFactory,
			'getConstructorInjectionList',
			new ReflectionClass(parent::class)
		);

		parent::__construct(...$parentConstructorArgs);
	}

	private function getUser(): User {
		return ReflectionUtil::getClassProperty(
			parent::class,
			$this,
			'user'
		);
	}

	public function process(Entity $entity, SaverParams $params): void {
		$entityType = $entity->getEntityType();

		if (!$this->hasRemindersField($entityType)) {
			return;
		}

		$dateAttribute = $this->getDateAttribute($entityType);

		if ($this->toRemove($entity)) {
			$this->deleteAll($entity);

			return;
		}

		if (!$this->toProcess($entity, $dateAttribute)) {
			return;
		}

		$typeList = $this->getTypeList();

		$onlyRemindersFieldChanged = $this->onlyRemindersFieldChanged($entity, $dateAttribute);

		if (!$entity->isNew() && !$onlyRemindersFieldChanged) {
			$this->deleteAll($entity);
		}

		if (!$entity->isNew() && $onlyRemindersFieldChanged) {
			$this->deleteAllForUser($entity);
		}

		$startString = $this->getStartString($entity, $dateAttribute);

		if (!$startString) {
			return;
		}

		$userIdList = $this->getUserIdList($entity);

		if ($userIdList === []) {
			return;
		}

		if ($onlyRemindersFieldChanged && in_array($this->getUser()->getId(), $userIdList)) {
			$userIdList = [$this->getUser()->getId()];
		}

		$start = DateTime::fromString($startString);

		foreach ($userIdList as $userId) {
			// If allowOtherUserReminders is enabled and reminders are explicitly set, use them for all users
			if ($entity->has('reminders') && $this->config->get('allowOtherUserReminders')) {
				$usePreferences = false;
			} else {
				$usePreferences = $userId !== $this->getUser()->getId() ||
					(!$entity->has('reminders') && $entity->isNew());
			}

			$reminderList = $usePreferences ?
				$this->getPreferencesReminderList($typeList, $userId, $entityType) :
				$this->getReminderList($entity, $typeList);

			foreach ($reminderList as $item) {
				$this->createReminder($entity, $userId, $start, $item);
			}
		}
	}

	/**
	 * @return string[]
	 */
	private function getUserIdList(CoreEntity $entity): array {
		return ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'getUserIdList',
			$entity
		);
	}

	private function hasRemindersField(string $entityType): bool {
		return ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'hasRemindersField',
			$entityType
		);
	}

	private function getDateAttribute(string $entityType): string {
		return ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'getDateAttribute',
			$entityType
		);
	}

	private function toRemove(CoreEntity $entity): bool {
		return ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'toRemove',
			$entity
		);
	}

	private function deleteAll(CoreEntity $entity): void {
		ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'deleteAll',
			$entity
		);
	}

	private function toProcess(CoreEntity $entity, string $dateAttribute): bool {
		return ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'toProcess',
			$entity,
			$dateAttribute
		);
	}

	/**
	 * @return string[]
	 */
	private function getTypeList(): array {
		return ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'getTypeList'
		);
	}

	private function onlyRemindersFieldChanged(CoreEntity $entity, string $dateAttribute): bool {
		return ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'onlyRemindersFieldChanged',
			$entity,
			$dateAttribute
		);
	}

	private function deleteAllForUser(CoreEntity $entity): void {
		ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'deleteAllForUser',
			$entity
		);
	}

	private function getStartString(CoreEntity $entity, string $dateAttribute): ?string {
		return ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'getStartString',
			$entity,
			$dateAttribute
		);
	}

	/**
	 * @param  string[]                             $typeList
	 * @return object{seconds: int, type: string}[]
	 */
	private function getPreferencesReminderList(array $typeList, string $userId, string $entityType): array {
		return ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'getPreferencesReminderList',
			$typeList,
			$userId,
			$entityType
		);
	}

	/**
	 * @param  string[]                             $typeList
	 * @return object{seconds: int, type: string}[]
	 */
	private function getReminderList(CoreEntity $entity, array $typeList): array {
		return ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'getReminderList',
			$entity,
			$typeList
		);
	}

	/**
	 * @param object{seconds: int, type: string} $item
	 */
	private function createReminder(
		CoreEntity $entity,
		string $userId,
		DateTime $start,
		object $item
	): void {
		ReflectionUtil::callClassMethod(
			parent::class,
			$this,
			'createReminder',
			$entity,
			$userId,
			$start,
			$item
		);
	}
}
