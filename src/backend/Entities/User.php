<?php

namespace Espo\Modules\Viacrm\Entities;

use RuntimeException;

class User extends \Espo\Entities\User
{
	public const string ENTITY_TYPE = 'User';
	public const string TEMPLATE_TYPE = 'Base';

	/**
	 * Get the human resource associated with this user.
	 *
	 * @return HumanResource|null
	 */
	public function getHumanResource(): ?HumanResource
	{
		$em = $this->entityManager;
		if (!$em) {
			throw new RuntimeException('No entity manager');
		}

		/** @var ?HumanResource */
		return $em->getRelation($this, 'humanResource')->findOne();
	}
}
