<?php

namespace Espo\Modules\Autocrm\Core\Email\Actions;

use Espo\Entities\EmailFilter;
use Espo\Modules\Autocrm\Classes\Abstract\Entities\EmailAction;
use Espo\Modules\Autocrm\Entities\Alert;
use Espo\Modules\Autocrm\Entities\Email;
use Espo\ORM\EntityManager;

class CreateAlert implements EmailAction {

	public function __construct(
		private readonly EntityManager $entityManager
	) {}

	public function process(Email $email, EmailFilter $filter, ?string $userId = null): void {
		if ($userId === null) {
			return;
		}

		$alertIcon = $filter->get('alertIconClass') ?? 'fas fa-bell';
		$alertMessage = $filter->get('alertMessage');
		$alertMessage = $this->replacePlaceholders($email, $alertMessage);

		$data = [
			'status' => Alert::STATUS_ACTIVE,
			'parentType' => Email::ENTITY_TYPE,
			'parentId' => $email->getId()
		];

		/** @var Alert|null $alert */
		$alert = $this->entityManager
			->getRDBRepository(Alert::ENTITY_TYPE)
			->where($data)
			->findOne();

		if ($alert === null) {
			/** @var Alert $alert */
			$alert = $this->entityManager->createEntity(Alert::ENTITY_TYPE, $data);
		}

		$alert
			->setMessage($alertMessage)
			->setIconClass($alertIcon)
			->toggleUser($userId);

		$this->entityManager->saveEntity($alert);
	}

	/**
	 * Replace placeholders in the message with actual values from the email
	 *
	 * @param  Email       $email
	 * @param  string|null $message
	 * @return string|null
	 */
	private function replacePlaceholders(Email $email, ?string $message): ?string {
		if ($message === null) {
			return null;
		}

		return preg_replace_callback('/\{([^}]+)}/', static function ($matches) use ($email) {
			return $email->get($matches[1]);
		}, $message);
	}

}
