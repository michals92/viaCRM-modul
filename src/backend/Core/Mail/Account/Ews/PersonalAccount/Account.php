<?php

namespace Espo\Modules\Viacrm\Core\Mail\Account\Ews\PersonalAccount;

use Espo\Core\Exceptions\Error;
use Espo\Core\Field\Date;
use Espo\Core\Field\DateTime;
use Espo\Core\Field\Link;
use Espo\Core\Field\LinkMultiple;
use Espo\Core\Field\LinkMultipleItem;
use Espo\Core\ORM\Repository\Option\SaveOption;
use Espo\Core\Utils\Crypt;
use Espo\Entities\Email;
use Espo\Entities\EmailAccount;
use Espo\Entities\User;
use Espo\Modules\Viacrm\Core\Mail\Account\Ews\FetchData;
use Espo\ORM\EntityManager;

/**
 * EWS Personal Email Account wrapper.
 */
class Account {

	private const PORTION_LIMIT = 10;

	private User $user;

	/**
	 * @throws Error
	 */
	public function __construct(
		private EmailAccount $entity,
		private EntityManager $entityManager,
		private Crypt $crypt
	) {
		if (!$this->entity->getAssignedUser()) {
			throw new Error('No assigned user.');
		}

		$userId = $this->entity->getAssignedUser()->getId();

		$user = $this->entityManager->getRDBRepositoryByClass(User::class)->getById($userId);

		if (!$user) {
			throw new Error('Assigned user not found.');
		}

		$this->user = $user;
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

	public function getEntity(): EmailAccount {
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

	public function getUser(): Link {
		$userLink = $this->entity->getAssignedUser();

		if (!$userLink) {
			throw new Error('No assigned user.');
		}

		return $userLink;
	}

	public function getUsers(): LinkMultiple {
		return LinkMultiple::create()->withAdded(
			LinkMultipleItem::create($this->user->getId())
		);
	}

	public function getAssignedUser(): ?Link {
		return $this->entity->getAssignedUser();
	}

	public function getTeams(): LinkMultiple {
		$teams = $this->entity->getTeams();

		if (count($teams->getIdList())) {
			return $teams;
		}

		$userTeams = $this->user->getTeams();

		return LinkMultiple::create(
			array_map(
				fn(string $id) => LinkMultipleItem::create($id),
				$userTeams->getIdList()
			)
		);
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
		return EmailAccount::ENTITY_TYPE;
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
