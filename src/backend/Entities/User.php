<?php

namespace Espo\Modules\Autocrm\Entities;

use RuntimeException;

class User extends \Espo\Entities\User {

	/**
	 * Get the human resource associated with this user
	 * 
	 * @return HumanResource|null
	 */
	public function getHumanResource(): ?HumanResource {
		if (!$this->entityManager) {
			throw new RuntimeException('No entity manager');
		}

		/** @var ?HumanResource */
		return $this->entityManager->getRelation($this, 'humanResource')->findOne();
	}

}
