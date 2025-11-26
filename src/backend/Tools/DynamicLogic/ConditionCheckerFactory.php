<?php

namespace Espo\Modules\Viacrm\Tools\DynamicLogic;

use DateTimeZone;
use Espo\Core\ORM\Entity;
use Espo\Entities\User;
use Espo\Modules\Viacrm\Core\Utils\Config\ApplicationConfig;
use Espo\Modules\Viacrm\Tools\DynamicLogic\ConditionChecker\Options;
use Exception;
use RuntimeException;

/**
 * @noinspection PhpUnused
 */

readonly class ConditionCheckerFactory {
	public function __construct(
		private User              $user,
		private ApplicationConfig $applicationConfig,
	) {}

	/**
	 * @param Entity $entity An entity to check.
	 */
	public function create(Entity $entity, ?User $user = null): ConditionChecker {
		try {
			$timezone = new DateTimeZone($this->applicationConfig->getTimeZone());
		} catch (Exception $e) {
			throw new RuntimeException('', 0, $e);
		}

		return new ConditionChecker(
			entity: $entity,
			user: $user ?? $this->user,
			options: new Options(
				timezone: $timezone,
			),
		);
	}
}
