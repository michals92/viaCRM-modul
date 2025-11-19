<?php

namespace Espo\Modules\Autocrm\Core\Workflow\Actions;

use Espo\Core\ORM\Entity as CoreEntity;
use Espo\Entities\Notification;
use Espo\Modules\Advanced\Core\Workflow\Utils;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Autocrm\Entities\Alert;
use Espo\ORM\Entity;
use Espo\Tools\Stream\Service as StreamService;
use stdClass;

@include_once ('custom/Espo/Modules/Advanced/Core/Workflow/Actions/Base.php');

/** @disregard */
ReflectionUtil::createClassIfNotExists(
	\Espo\Modules\Advanced\Core\Workflow\Actions\Base::class,
	<<<'PHP'
    namespace Espo\Modules\Advanced\Core\Workflow\Actions;

    class Base {}
    PHP
);

/** @disregard */
class CreateAlert extends \Espo\Modules\Advanced\Core\Workflow\Actions\Base {

	/**
	 * Union type for cross-version compatibility with Advanced Pack.
	 * Old versions use Entity (Espo\ORM\Entity), new versions use CoreEntity (Espo\Core\ORM\Entity).
	 *
	 * @param array<string, mixed> $options
	 */
	protected function run(CoreEntity|Entity $entity, stdClass $actionData, array $options = []): bool {
		if (empty($actionData->recipient)) {
			return false;
		}

		if (empty($actionData->messageTemplate)) {
			return false;
		}

		if (!$entity instanceof CoreEntity) {
			return false;
		}

		switch ($actionData->recipient) {
			case 'specifiedUsers':
				if (empty($actionData->userIdList) || !is_array($actionData->userIdList)) {
					return false;
				}

				$userIds = $actionData->userIdList;

				break;

			case 'specifiedTeams':
				$userIds = $this->getHelper()->getUserIdsByTeamIds($actionData->specifiedTeamsIds);

				break;

			case 'teamUsers':
				$entity->loadLinkMultipleField('teams');
				$userIds = $this->getHelper()->getUserIdsByTeamIds($entity->get('teamsIds'));

				break;

			case 'followers':
				$userIds = $this->getHelper()->getFollowerUserIds($entity);

				break;

			case 'followersExcludingAssignedUser':
				$userIds = $this->getHelper()->getFollowerUserIdsExcludingAssignedUser($entity);
				break;

			case 'currentUser':
				$userIds = [$this->getUser()->getId()];

				break;

			default:
				// The method only exists in new versions of advanced pack  
				if (method_exists($this, 'getRecipients')) {
					/** @disregard */
					$userIds = $this->getRecipients($this->getEntity(), $actionData->recipient)->getIds();
				} else {
					$userIds = $this->getRecipientUserIdList($actionData->recipient);
				}

				break;
		}

		$message = $actionData->messageTemplate;

		$variables = $this->getVariables();

		// Add custom entityLink variable as clickable HTML link
		$entityUrl = '#' . $entity->getEntityType() . '/view/' . $entity->getId();
		$entityName = $entity->get('name');
		
		// If no name, use translated entity type
		if (!$entityName) {
			$entityType = $entity->getEntityType();
			/** @var \Espo\Core\Utils\Language $language */
			$language = $this->getContainer()->get('language');
			$entityName = $language->translateLabel($entityType, 'scopeNames');
		}
		
		$entityLink = '<a href="' . $entityUrl . '">' . htmlspecialchars($entityName) . '</a>';
		
		$variables = (object) array_merge((array) $variables, [
			'entityLink' => $entityLink
		]);

		foreach (get_object_vars($variables) as $key => $value) {
			if (is_string($value) || is_int($value) || is_float($value)) {
				if (is_int($value) || is_float($value)) {
					$value = (string)$value;
				} else if (!$value) {
					continue;
				}

				$message = str_replace('{$$' . $key . '}', $value, $message);
			}
		}

		/** @var Alert $alert */
		$alert = $this->getEntityManager()->createEntity(Alert::ENTITY_TYPE, [
			'usersIds' => $userIds,
			'message' => $message,
			'parentId' => $entity->getId(),
			'parentType' => $entity->getEntityType(),
			'iconClass' => $actionData->iconClass ?? null,
			'showInCalendar' => $actionData->showInCalendar ?? true,
		]);

		foreach ($userIds as $userId) {
			$notification = $this->getEntityManager()->getNewEntity(Notification::ENTITY_TYPE);

			$notification->set([
				'type' => Notification::TYPE_MESSAGE,
				'data' => [
					'entityId' => $entity->getId(),
					'entityType' => $entity->getEntityType(),
					'entityName' => $entity->get('name'),
					'userId' => $this->getUser()->getId(),
					'userName' => $this->getUser()->getName(),
				],
				'userId' => $userId,
				'message' => $message,
				'relatedId' => $entity->getId(),
				'relatedType' => $entity->getEntityType(),
			]);

			$this->getEntityManager()->saveEntity($notification);
			$alert->toggleUser($userId);
		}

		return true;
	}

	/**
	 * @return string[]
	 */
	protected function getRecipientUserIdList(string $recipient): array {
		/** @disregard */
		// @phpstan-ignore-next-line
		$data = $this->getActionData();

		$link = $recipient;
		$entity = $this->getEntity();
		$e = $entity;

		if (strpos($link, 'link:') === 0) {
			$link = substr($link, 5);
		}

		if (strpos($link, '.')) {
			list ($firstLink, $link) = explode('.', $link);

			if (
				!$entity->hasRelation($firstLink) &&
				(
					$entity->getRelationType($firstLink) === 'belongsTo' ||
					$entity->getRelationType($firstLink) === 'belongsToParent'
				)
			) {
				return [];
			}

			$e = $entity->get($firstLink);
			if (!$e) {
				return [];
			}
		}

		if ($link === 'followers') {
			/** @var StreamService $streamService */
			$streamService = $this->injectableFactory->create(StreamService::class);

			return $streamService->getEntityFollowerIdList($e);
		}

		if (
			$e->hasRelation($link) &&
			(
				$e->getRelationType($link) === Entity::HAS_MANY ||
				$e->getRelationType($link) === Entity::MANY_MANY
			) &&
			$e->hasLinkMultipleField($link) &&
			$e->getRelationParam($link, 'entity')
		) {
			$idList = $e->getLinkMultipleIdList($link);

			if (!empty($idList)) {
				return $idList;
			}
		}

		$fieldEntity = Utils::getFieldValue($e, $link, true, $this->getEntityManager());

		if ($fieldEntity instanceof Entity) {
			return [$fieldEntity->getId()];
		}

		return [];
	}

}
