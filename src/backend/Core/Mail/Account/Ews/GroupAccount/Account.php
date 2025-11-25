<?php

namespace Espo\Modules\Viacrm\Core\Mail\Account\Ews\GroupAccount;

use Espo\Core\Exceptions\Error;
use Espo\Core\Field\Date;
use Espo\Core\Field\DateTime;
use Espo\Core\Field\Link;
use Espo\Core\Field\LinkMultiple;
use Espo\Core\ORM\Repository\Option\SaveOption;
use Espo\Core\Utils\Crypt;
use Espo\Entities\Email;
use Espo\Entities\InboundEmail;
use Espo\Modules\Viacrm\Core\Mail\Account\Ews\FetchData;
use Espo\ORM\EntityManager;

/**
 * EWS Group Email Account (InboundEmail) wrapper.
 */
class Account {

	private const PORTION_LIMIT = 20;

	/**
	 * @throws Error
	 */
	public function __construct(
		private InboundEmail $entity,
		private EntityManager $entityManager,
		private Crypt $crypt
	) {
		if (!$this->entity->getId()) {
			throw new Error('No ID.');
		}
	}

	public function updateFetchData(FetchData $fetchData): void {
		$this->entity->set('fetchData', $fetchData->getRaw());

		$this->entityManager->saveEntity($this->entity, [SaveOption::SILENT => true]);
	}

	public function updateConnectedAt(): void {
		$this->entity->set('connectedAt', DateTime::createNow()->toString());

		$this->entityManager->saveEntity($this->entity, [SaveOption::SILENT => true]);
	}

	public function relateEmail(Email $email): void {
		$this->entityManager
		    ->getRelation($this->entity, 'emails')
		    ->relate($email);
	}

	public function getEntity(): InboundEmail {
		return $this->entity;
	}

	public function getPortionLimit(): int {
		return self::PORTION_LIMIT;
	}

	public function isAvailableForFetching(): bool {
		return $this->entity->isActive();
	}

	public function getEmailAddress(): ?string {
		return $this->entity->getEmailAddress();
	}

	public function getUser(): ?Link {
		return null;
	}

	public function getUsers(): LinkMultiple {
		// InboundEmail doesn't have a getUsers() method.
		// Users are determined from teams, but for EWS we'll return empty for now.
		// This can be enhanced later to load users from teams if needed.
		return LinkMultiple::create();
	}

	public function getAssignedUser(): ?Link {
		return $this->entity->getAssignToUser();
	}

	public function getTeams(): LinkMultiple {
		return $this->entity->getTeams();
	}

	public function keepFetchedEmailsUnread(): bool {
		return (bool) $this->entity->get('keepFetchedEmailsUnread');
	}

	public function getFetchData(): FetchData {
		$raw = $this->entity->get('fetchData');

		if (!$raw instanceof \stdClass) {
			$raw = (object) [];
		}

		return FetchData::fromRaw($raw);
	}

	public function getFetchSince(): ?Date {
		return $this->entity->getFetchSince();
	}

	public function getEmailFolder(): ?Link {
		return $this->entity->getEmailFolder();
	}

	public function getId(): ?string {
		return $this->entity->getId();
	}

	public function getEntityType(): string {
		return InboundEmail::ENTITY_TYPE;
	}

	public function getEwsServerUrl(): ?string {
		return $this->entity->get('ewsServerUrl');
	}

	public function getEwsUserName(): ?string {
		return $this->entity->get('ewsUserName');
	}

	public function getEwsPassword(): ?string {
		$password = $this->entity->get('ewsPassword');

		if ($password === null) {
			return null;
		}

		return $this->crypt->decrypt($password);
	}

}
