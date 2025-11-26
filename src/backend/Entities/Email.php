<?php

namespace Espo\Modules\Viacrm\Entities;

use Espo\Core\Field\LinkMultiple;
use Espo\ORM\Query\Part\Order;
use LogicException;
use stdClass;

class Email extends \Espo\Entities\Email {
	public const string ENTITY_TYPE = 'Email';
	public const string TEMPLATE_TYPE = 'Base';

	public function getBodyForSending(): string {
		$body = parent::getBodyForSending();

		if (!empty($body)) {
			$attachmentList = $this->getInlineAttachmentList();

			foreach ($attachmentList as $attachment) {
				$id = $attachment->getId();

				$body = str_replace(
					"'?entryPoint=attachment&amp;id={$id}'",
					"'cid:{$id}'",
					$body
				);
			}
		}

		return $body;
	}

	/**
	 * BC methods
	 * These methods exist from Espo 9.0.0 onward, but we need them here for code to work in Espo 8
	 */
	public function getUsers(): LinkMultiple {
		/** @var LinkMultiple */
		return $this->getValueObject('users');
	}

	public function setUserColumnFolderId(string $userId, ?string $folderId): self {
		$this->setLinkMultipleColumn('users', self::USERS_COLUMN_FOLDER_ID, $userId, $folderId);

		return $this;
	}

	public function setUserColumnIsRead(string $userId, bool $isRead): self {
		$this->setLinkMultipleColumn('users', self::USERS_COLUMN_IS_READ, $userId, $isRead);

		return $this;
	}

	public function setUserColumnInTrash(string $userId, bool $inTrash): self {
		$this->setLinkMultipleColumn('users', self::USERS_COLUMN_IN_TRASH, $userId, $inTrash);

		return $this;
	}

	public function setUserSkipNotification(string $userId): self {
		/** @var stdClass $map */
		$map = $this->get('skipNotificationMap') ?? (object) [];
		$map->$userId = true;
		$this->set('skipNotificationMap', $map);

		return $this;
	}

	/**
	 * This method exists in 8.4.2, but contains a bug that was fixed in 9.0.0
	 */
	public function loadLinkMultipleField(string $field, ?array $columns = null): void {
		$em = $this->entityManager;
		if (!$this->hasLinkMultipleField($field)) {
			throw new LogicException("Called `loadLinkMultipleField` on non-link-multiple field `$field`.");
		}

		if (!$em) {
			throw new LogicException('No entity-manager.');
		}

		$select = ['id', 'name'];

		$hasType = $this->hasAttribute($field . 'Types');

		if ($hasType) {
			$select[] = 'type';
		}

		$columns ??= $this->getLinkMultipleColumnsFromDefs($field);

		if ($columns) {
			foreach ($columns as $it) {
				$select[] = $it;
			}
		}

		$selectBuilder = $em
		    ->getRelation($this, $field)
		    ->select($select);

		$orderBy = null;
		$order = null;

		$orderParams = $this->getRelationOrderParams($field);

		if ($orderParams) {
			$orderBy = $orderParams['orderBy'] ?? null;
			/** @var string|bool|null $order */
			$order = $orderParams['order'] ?? null;
		}

		if ($orderBy) {
			if (is_string($orderBy) && !in_array($orderBy, $select)) {
				$selectBuilder->select($orderBy);
			}

			if (is_string($order)) {
				$order = strtoupper($order);

				if ($order !== Order::ASC && $order !== Order::DESC) {
					$order = Order::ASC;
				}
			}

			$selectBuilder->order($orderBy, $order);
		}

		$collection = $selectBuilder->find();

		$ids = [];
		$names = (object) [];
		$types = (object) [];
		$columnsData = (object) [];

		foreach ($collection as $e) {
			$id = $e->getId();

			$ids[] = $id;

			$names->$id = $e->get('name');

			if ($hasType) {
				$types->$id = $e->get('type');
			}

			if (!$columns) {
				continue;
			}

			$columnsData->$id = (object) [];

			foreach ($columns as $column => $foreignAttribute) {
				$columnsData->$id->$column = $e->get($foreignAttribute);
			}
		}

		$idsAttribute = $field . 'Ids';
		$namesAttribute = $field . 'Names';
		$typesAttribute = $field . 'Types';
		$columnsAttribute = $field . 'Columns';

		$toSetFetched = !$this->isNew() && !$this->hasFetched($idsAttribute);

		$this->set($idsAttribute, $ids);
		$this->set($namesAttribute, $names);

		if ($toSetFetched) {
			$this->setFetched($idsAttribute, $ids);
			$this->setFetched($namesAttribute, $names);
		}

		if ($hasType) {
			$this->set($typesAttribute, $types);

			if ($toSetFetched) {
				$this->setFetched($typesAttribute, $types);
			}
		}

		if ($columns) {
			$this->set($columnsAttribute, $columnsData);

			if ($toSetFetched) {
				$this->setFetched($columnsAttribute, $columnsData);
			}
		}
	}

	/**
     * @return string[]|null
     */
	private function getLinkMultipleColumnsFromDefs(string $field): ?array {
		$em = $this->entityManager;
		if (!$em) {
			return null;
		}

		$entityDefs = $em->getDefs()->getEntity($this->entityType);

		/** @var ?array<string, string> $columns */
		$columns = $entityDefs->tryGetField($field)?->getParam('columns');

		if (!$columns) {
			return $columns;
		}

		$foreignEntityType = $entityDefs->tryGetRelation($field)?->tryGetForeignEntityType();

		if ($foreignEntityType) {
			$foreignEntityDefs = $em->getDefs()->getEntity($foreignEntityType);

			foreach ($columns as $column => $attribute) {
				if (!$foreignEntityDefs->hasAttribute($attribute)) {
					// For backward compatibility. If foreign attributes defined in the field do not exist.
					unset($columns[$column]);
				}
			}
		}

		return $columns;
	}
}
