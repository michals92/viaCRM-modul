<?php

namespace Espo\Modules\Viacrm\Tools\UserKanban;

use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Id\RecordIdGenerator;
use Espo\Core\Utils\Metadata;

class UserOrderer
{
	public function __construct(
		private EntityManager $entityManager,
		private Metadata $metadata,
		private RecordIdGenerator $idGenerator
	) {
	}

	public function setEntityType(string $entityType): UserOrdererProcessor
	{
		return $this->createProcessor()->setEntityType($entityType);
	}

	public function setGroup(string $group): UserOrdererProcessor
	{
		return $this->createProcessor()->setGroup($group);
	}

	public function setUserId(string $userId): UserOrdererProcessor
	{
		return $this->createProcessor()->setUserId($userId);
	}

	public function setMaxNumber(?int $maxNumber): UserOrdererProcessor
	{
		return $this->createProcessor()->setMaxNumber($maxNumber);
	}

	public function createProcessor(): UserOrdererProcessor
	{
		return new UserOrdererProcessor(
			$this->entityManager,
			$this->metadata,
			$this->idGenerator
		);
	}
}
