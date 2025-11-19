<?php

namespace Espo\Modules\Autocrm\Tools\DynamicLogic;

use DateTimeImmutable;
use DateTimeZone;
use Espo\Core\Field\Date;
use Espo\Core\ORM\Entity;
use Espo\Core\Utils\Json;
use Espo\Entities\User;
use Espo\Modules\Autocrm\Core\Field\DateTime;
use Espo\Modules\Autocrm\Core\Utils\DateTime\SystemClock;
use Espo\Modules\Autocrm\Tools\DynamicLogic\ConditionChecker\Options;
use Espo\Modules\Autocrm\Tools\DynamicLogic\Exceptions\BadCondition;
use Exception;
use RuntimeException;

class ConditionChecker {

	const DEBUG_MODE = false;

	/**
	 * Use `ConditionCheckerFactory` instead.
	 */
	public function __construct(
		private readonly Entity      $entity,
		private readonly ?User       $user = null,
		private readonly Options     $options = new Options(),
		private readonly SystemClock $clock = new SystemClock(),
	) {}

	/**
	 * @param array<int, mixed> $args
	 */
	protected function debug(...$args): void {
		// @phpstan-ignore-next-line
		if (!self::DEBUG_MODE) {
			return;
		}
		// @phpstan-ignore-next-line
		$formatted = array_map(static function ($arg) {
			try {
				if (is_object($arg)) {
					return '(' . get_class($arg) . ')' . ': ' . JSON::encode($arg);
				}
				if (is_array($arg)) {
					return '(Array): ' . JSON::encode($arg);
				}
			} catch (\JsonException $e) {
				return $e->getMessage();
			}
			if (is_bool($arg)) {
				return '(Bool): ' . ($arg ? 'true' : 'false');
			}
			if (is_null($arg)) {
				return '(null)';
			}
			if (!is_string($arg)) {
				return '(' . gettype($arg) . '): ' . (string)$arg;
			}

			return $arg;
		}, $args);

		$GLOBALS['log']->debug('[Autocrm/ConditionChecker] ' . implode(' ', $formatted));
	}

	/**
	 * @throws BadCondition
	 */
	public function check(Item $item): bool {
		$type = $item->type;
		$value = $item->value;
		$subjectType = $item->subjectType ?? null;
		if ($subjectType === 'field' || isset($item->field)) {
			$field = $item->field ?? throw new BadCondition("No field specified for subject type 'field'.");
			$relationName = preg_replace('/(Ids?)?$/', '', $field);

			if (!is_null($relationName) &&
				($relationType = $this->entity->getRelationType($relationName))
			) {
				$this->debug("Loading relation $relationName of type $relationType.");
				match ($relationType) {
					'manyMany' => $this->entity->loadLinkMultipleField($relationName),
					default => $this->entity->loadLinkField($relationName),
				};
			}

			//$value = $this->getAttributeValue($item->attribute); //we probably want this variable to remain '$item->value'? The $setValue is the value from entity, therefore the reason we've just loaded the relations.
		}
		$this->debug(['type' => $type, 'subjectType' => $subjectType, 'value' => $value]);
		if ($type === Type::And) {
			if (!is_array($value)) {
				throw new BadCondition();
			}

			foreach ($value as $subItem) {
				$this->debug($type, 'Checking sub item', $subItem);
				if (!$subItem instanceof Item) {
					throw new BadCondition();
				}

				if (!$this->check($subItem)) {
					return false;
				}
			}

			return true;
		}

		if ($type === Type::Or) {
			if (!is_array($value)) {
				throw new BadCondition();
			}

			foreach ($value as $subItem) {
				$this->debug($type, 'Checking sub item', $subItem);
				if (!$subItem instanceof Item) {
					throw new BadCondition();
				}

				if ($this->check($subItem)) {
					return true;
				}
			}

			return false;
		}

		if ($type === Type::Not) {
			if (!$value instanceof Item) {
				throw new BadCondition();
			}
			$this->debug('Checking NOT value', $value);

			return !$this->check($value);
		}

		if (!$item->attribute) {
			throw new BadCondition('No attribute.');
		}

		$setValue = $this->getAttributeValue($item->attribute);
		$this->debug('setValue:', $setValue);

		if ($type === Type::Equals) {
			$this->debug('Checking condition (Type::Equals) =>', $setValue === $value);

			return $setValue === $value;
		}

		if ($type === Type::NotEquals) {
			$this->debug('Checking condition (Type::NotEquals) =>', $setValue !== $value);

			return $setValue !== $value;
		}

		if ($type === Type::IsEmpty) {
			$result = $setValue === [] ||
				$setValue === null ||
				$setValue === false ||
				$setValue === '';
			$this->debug('Checking condition (Type::IsEmpty) =>', $result);

			return $result;
		}

		if ($type === Type::IsNotEmpty) {
			$result = !(
				$setValue === [] ||
				$setValue === null ||
				$setValue === false ||
				$setValue === ''
			);
			$this->debug('Checking condition (Type::IsNotEmpty) =>', $result);

			return $result;
		}

		if ($type === Type::IsTrue) {
			$this->debug('Checking condition (Type::IsTrue) =>', (bool)$setValue);

			return (bool)$setValue;
		}

		if ($type === Type::IsFalse) {
			$this->debug('Checking condition (Type::IsFalse) =>', !$setValue);

			return !$setValue;
		}

		if ($type === Type::Contains) {
			if (!$setValue) {
				$this->debug('Checking condition (Type::Contains -> case: empty $setValue) => always false');

				return false;
			}
			if (is_string($setValue) && is_string($value)) {
				$this->debug('Checking condition (Type::Contains -> case: both strings) =>', str_contains($setValue, $value));

				return str_contains($setValue, $value);
			}
			if (is_array($setValue)) {
				if (is_array($value)) {
					$this->debug('Checking condition (Type::Contains -> case: both arrays) =>', empty(array_intersect($value, $setValue)));

					return !empty(array_intersect($value, $setValue));
				}
				$this->debug('Checking condition (Type::Contains -> case: array and value) =>', in_array($value, $setValue, true));

				return in_array($value, $setValue, true);
			}
			$this->debug('Checking condition (Type::Contains -> case: other) => always false');

			return false;
		}

		if ($type === Type::NotContains) {
			if (!$setValue) {
				$this->debug('Checking condition (Type::NotContains -> case: empty $setValue) => always true');

				return true;
			}
			if (is_string($setValue) && is_string($value)) {
				$this->debug('Checking condition (Type::NotContains -> case: both strings) =>', !str_contains($setValue, $value));

				return !str_contains($setValue, $value);
			}
			if (is_array($setValue)) {
				if (is_array($value)) {
					$this->debug('Checking condition (Type::NotContains -> case: both arrays) =>', empty(array_intersect($value, $setValue)));

					return empty(array_intersect($value, $setValue));
				}
				$this->debug('Checking condition (Type::NotContains -> case: array and value) =>', !in_array($value, $setValue, true));

				return !in_array($value, $setValue, true);
			}
			$this->debug('Checking condition (Type::NotContains -> case: other) => always true');

			return true;
		}

		if ($type === Type::Has) {
			if (is_array($setValue)) {
				$this->debug('Checking condition (Type::Has) =>', in_array($value, $setValue, true));

				return in_array($value, $setValue, true);
			}
			$this->debug('Checking condition (Type::Has -> array expected) => false');

			return false;
		}

		if ($type === Type::NotHas) {
			if (is_array($setValue)) {
				$this->debug('Checking condition (Type::NotHas) =>', !in_array($value, $setValue, true));

				return !in_array($value, $setValue, true);
			}
			$this->debug('Checking condition (Type::NotHas -> array expected) => true');

			return true;
		}

		if ($type === Type::StartsWith) {
			if (is_string($setValue) && is_string($value)) {
				$this->debug('Checking condition (Type::StartsWith) =>', str_starts_with($setValue, $value));

				return str_starts_with($setValue, $value);
			}
			$this->debug('Checking condition (Type::StartsWith -> strings expected) => false');

			return false;
		}

		if ($type === Type::EndsWith) {
			if (is_string($setValue) && is_string($value)) {
				$this->debug('Checking condition (Type::EndsWith) =>', str_ends_with($setValue, $value));

				return str_ends_with($setValue, $value);
			}
			$this->debug('Checking condition (Type::EndsWith -> strings expected) => false');

			return false;
		}

		if ($type === Type::Matches) {
			if (is_string($setValue) && is_string($value)) {
				$result = (bool)preg_match($value, $setValue);
				$this->debug('Checking condition (Type::Matches) =>', $result);

				return $result;
			}
			$this->debug('Checking condition (Type::Matches -> strings expected) => false');

			return false;
		}

		if ($type === Type::GreaterThan) {
			$this->debug('Checking condition (Type::GreaterThan) =>', $setValue > $value);

			return $setValue > $value;
		}

		if ($type === Type::LessThan) {
			$this->debug('Checking condition (Type::LessThan) =>', $setValue < $value);

			return $setValue < $value;
		}

		if ($type === Type::GreaterThanOrEquals) {
			$this->debug('Checking condition (Type::GreaterThanOrEquals) =>', $setValue >= $value);

			return $setValue >= $value;
		}

		if ($type === Type::LessThanOrEquals) {
			$this->debug('Checking condition (Type::LessThanOrEquals) =>', $setValue <= $value);

			return $setValue <= $value;
		}

		if ($type === Type::In) {
			if (is_array($value)) {
				$this->debug('Checking condition (Type::In) =>', in_array($setValue, $value, true));

				return in_array($setValue, $value, true);
			}
			$this->debug('Checking condition (Type::In -> array expected) => false');

			return false;
		}

		if ($type === Type::NotIn) {
			if (is_array($value)) {
				$this->debug('Checking condition (Type::NotIn) =>', !in_array($setValue, $value, true));

				return !in_array($setValue, $value, true);
			}
			$this->debug('Checking condition (Type::NotIn -> array expected) => true');

			return true;
		}

		if (!$setValue || !is_string($setValue)) {
			$this->debug('setValue is empty or not a string, returning false for date conditions');

			return false;
		}

		if ($type === Type::IsToday) {
			if (strlen($setValue) > 10) {
				$setDateTime = DateTime::fromDateTime($this->createDateTime($setValue));
				$todayStart = $this->createNow()
					->withTimezone($this->getTimeZone())
					->withTime(0, 0);
				$todayEnd = $todayStart->addDays(1);
				$result = $todayStart->isLessThanOrEqualTo($setDateTime) && $setDateTime->isLessThan($todayEnd);
				$this->debug('Checking condition (Type::IsToday -> datetime) =>', $result);

				return $result;
			}

			$setDate = Date::fromDateTime($this->createDateTime($setValue));
			$today = $this->createToday();
			$result = $setDate->isEqualTo($today);
			$this->debug('Checking condition (Type::IsToday -> date) =>', $result);

			return $result;
		}

		if ($type === Type::InFuture) {
			if (strlen($setValue) > 10) {
				$setDateTime = DateTime::fromDateTime($this->createDateTime($setValue));
				$result = $setDateTime->isGreaterThan($this->createNow());
				$this->debug('Checking condition (Type::InFuture -> datetime) =>', $result);

				return $result;
			}

			$setDate = Date::fromDateTime($this->createDateTime($setValue));
			$today = $this->createToday();
			$result = $setDate->isGreaterThan($today);
			$this->debug('Checking condition (Type::InFuture -> date) =>', $result);

			return $result;
		}

		if ($type === Type::InPast) {
			if (strlen($setValue) > 10) {
				$setDateTime = DateTime::fromDateTime($this->createDateTime($setValue));
				$result = $setDateTime->isLessThan($this->createNow());
				$this->debug('Checking condition (Type::InPast -> datetime) =>', $result);

				return $result;
			}

			$setDate = Date::fromDateTime($this->createDateTime($setValue));
			$today = $this->createToday();
			$result = $setDate->isLessThan($today);
			$this->debug('Checking condition (Type::InPast -> date) =>', $result);

			return $result;
		}

		/** @phpstan-ignore-next-line deadCode.unreachable */
		throw new BadCondition("Unimplemented type '$type->value'.");
	}

	private function getAttributeValue(string|null $attribute): mixed { //todo: implement autocrm customs: $settings, $installedExensions
		if (is_null($attribute)) {
			return null;
		}
		if (str_starts_with($attribute, '$user')) {
			if (!$this->user) {
				return null;
			}

			if ($attribute === '$user.id') {
				return $this->user->getId();
			}

			if ($attribute === '$user.teamsIds') {
				return $this->user->getTeamIdList();
			}

			if ($attribute === '$user.rolesIds') {
				return $this->user->getRoles()->getIdList();
			}
		}

		return $this->entity->get($attribute);
	}

	private function getTimeZone(): DateTimeZone {
		return $this->options->timezone;
	}

	private function createDateTime(string $value): DateTimeImmutable {
		try {
			$setDateTime = new DateTimeImmutable($value, $this->getTimeZone());
		} catch (Exception $e) {
			throw new RuntimeException($e->getMessage(), 0, $e);
		}

		return $setDateTime;
	}

	private function createNow(): DateTime {
		return DateTime::fromDateTime($this->clock->now());
	}

	private function createToday(): Date {
		$dateTime = $this->clock
			->now()
			->setTimezone($this->getTimeZone());

		return Date::fromDateTime($dateTime);
	}

}
