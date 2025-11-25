<?php

namespace Espo\Modules\Viacrm\Tools\DynamicLogic;

use Espo\Core\InjectableFactory;
use Espo\Core\Select\Where\Item\Type as WhereType;
use Espo\Core\Utils\Config;
use Espo\Entities\Team;
use Espo\Entities\User;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\Part\Expression as Expr;
use Espo\ORM\Query\Part\Join;
use Espo\ORM\Query\Part\WhereClause;
use Espo\ORM\Query\Part\WhereItem as WhereClauseItem;
use Espo\ORM\Query\SelectBuilder as QueryBuilder;

class DefaultConditionConverter implements ConditionConverter {

	public const ALIAS_USER = 'wiu'; // Where Item User
	public const ALIAS_USER_ROLE = 'wiuru'; // Where Item User Role User
	public const ALIAS_USER_TEAM = 'wiutu'; // Where Item User Team User
	protected const ALIAS_ENTITY_TEAM = 'wiet';

	protected string $entityType;
	protected Entity $seedEntity;

	public function __construct(
		private readonly EntityManager $entityManager
	) {}

	/**
	 * Convert a dynamic logic condition to query parameters.
	 *
	 * @param  QueryBuilder                  $queryBuilder The query builder instance
	 * @param  array<string, mixed>          $condition    The condition data to convert
	 * @param  array<string, mixed>          $options      The options for conversion
	 * @throws \ReflectionException
	 * @throws \ReflectionException
	 * @return array<string|int, mixed>|null Converted condition or null if not applicable
	 */
	public function convert(QueryBuilder $queryBuilder, array $condition, array $options): null|array {
		$attribute = $condition['attribute'];
		$value = $condition['value'] ?? null;
		$this->entityType ??= $queryBuilder->build()->getFrom() ?? throw new \LogicException('EntityType cannot be null in ConditionConverter.');
		$this->seedEntity ??= $this->entityManager->getNewEntity($this->entityType);

		if ($attribute && str_starts_with($attribute, '$')) {
			$parts = explode('.', $attribute, 2);
			if (
				(count($parts) === 2) &&
				($scope = $parts[0]) &&
				($property = $parts[1])
			) {
				if ($scope === '$user') {
					return $this->convertUserScopeAttribute($queryBuilder, $property, $value, $options, $condition)->getRaw();
				}
			} else if (
				($value) &&
				(
					str_starts_with($attribute, '$installedExtensions') ||
					str_starts_with($attribute, '$settings')
				)
			) {
				$condition = $this->convertConfigAttribute($queryBuilder, $attribute, $value, $options)->getRaw();
			} else {
				throw new \LogicException('Unsupported attribute or null value for attribute: ' . $attribute);
			}
		}

		if ($condition['type']) {
			$condition['type'] = TypeConverter::dynamicLogicToWhereType($condition['type']);
		}
		if (isset($condition['data']['field'])) {
			if (($condition['subjectType'] ?? null) === 'field') {
				$this->tryJoinLinkField($queryBuilder, $condition['data']['field']);
			}
			$condition['attribute'] = $condition['data']['field'];
		}

		$whereItemConverter = $options[Option::WHERE_ITEM_CONVERTER];
		$converterParams = $options[Option::CONVERTER_PARAMS];
		$rawItem = \Espo\Core\Select\Where\Item::fromRaw($condition);
		/** @var WhereClauseItem $convertedCondition */
		$convertedCondition = ReflectionUtil::callMethod($whereItemConverter, 'convert', $queryBuilder, $rawItem, $converterParams);

		return $convertedCondition->getRaw();
	}

	/**
	 * Handles attribute processing and JOIN additions for the '$user' scope.
	 * Returns the potentially modified attribute name to use in the WHERE clause.
	 *
	 * @param  QueryBuilder              $queryBuilder
	 * @param  string                    $property
	 * @param  array<string>|string|null $value
	 * @param  array<string, mixed>      $options
	 * @param  array<string, mixed>      $originalCondition The full original condition array
	 * @return WhereClauseItem           The attribute name (possibly aliased)
	 * @internal
	 */
	private function convertUserScopeAttribute(
		QueryBuilder      $queryBuilder,
		string            $property,
		null|array|string $value,
		array             $options,
		array             $originalCondition
	): WhereClauseItem {
		if (!$queryBuilder->hasLeftJoinAlias(self::ALIAS_USER)) {
			if (
				!isset($options[Option::USERS_IDS]) ||
				empty($options[Option::USERS_IDS])
			) {
				throw new \LogicException('User IDs (options[' . Option::USERS_IDS . ']) not provided or is empty for $user scope.');
			}
			$usersIds = $options[Option::USERS_IDS];
			if (!is_array($usersIds)) {
				$usersIds = [(string)$usersIds];
			}
			$queryBuilder->leftJoin(
				Join::createWithTableTarget(User::ENTITY_TYPE, self::ALIAS_USER)
					->withConditions(Cond::in(Expr::column(self::ALIAS_USER . '.id'), $usersIds))
			);
		}
		$userFieldColumn = null;
		$entityFieldName = null;
		switch ($property) {
			case 'id':
				if (is_array($value)) {
					return Cond::in(Expr::column(self::ALIAS_USER . '.id'), $value);
				}

				return Cond::equal(Expr::column(self::ALIAS_USER . '.id'), $value);
			case 'rolesIds':
				if (
					!$queryBuilder->hasJoinAlias(self::ALIAS_USER_ROLE) &&
					!$queryBuilder->hasLeftJoinAlias(self::ALIAS_USER_ROLE)
				) {
					$queryBuilder->leftJoin(
						Join::createWithTableTarget('RoleUser', self::ALIAS_USER_ROLE)
							->withConditions(Cond::and(
								Cond::equal(Expr::column(self::ALIAS_USER_ROLE . '.userId'), Expr::column(self::ALIAS_USER . '.id')),
								Cond::notEqual(Expr::column(self::ALIAS_USER_ROLE . '.deleted'), Expr::value(true))
							))
					);
				}
				if ($value === null) {
					return Cond::equal(Expr::column(self::ALIAS_USER_ROLE . '.roleId'), null);
				}

				$rolesIds = is_array($value) ? $value : [$value];

				return Cond::in(Expr::column(self::ALIAS_USER_ROLE . '.roleId'), $rolesIds);
			case 'teamsIds':
				if (
					!$queryBuilder->hasJoinAlias(self::ALIAS_USER_TEAM) &&
					!$queryBuilder->hasLeftJoinAlias(self::ALIAS_USER_TEAM)
				) {
					$queryBuilder->leftJoin(
						Join::createWithTableTarget(Team::RELATIONSHIP_TEAM_USER, self::ALIAS_USER_TEAM)
							->withConditions(Cond::and(
								Cond::equal(Expr::column(self::ALIAS_USER_TEAM . '.userId'), Expr::column(self::ALIAS_USER . '.id')),
								Cond::notEqual(Expr::column(self::ALIAS_USER_TEAM . '.deleted'), Expr::value(true))
							))
					);
				}
				if (
					($originalCondition['subjectType'] ?? null) === 'field' &&
					!empty($originalCondition['data']['field']) &&
					is_string($originalCondition['data']['field'])
				) {
					$entityFieldName = $this->tryJoinLinkField($queryBuilder, $originalCondition['data']['field'], 'teamId', Team::RELATIONSHIP_ENTITY_TEAM, self::ALIAS_ENTITY_TEAM);
					$userFieldColumn = self::ALIAS_USER_TEAM . '.teamId';
					break;
				}

				if ($value === null) {
					return Cond::equal(Expr::column(self::ALIAS_USER_TEAM . '.teamId'), null);
				}

				$teamsIds = is_array($value) ? $value : [$value];

				return Cond::in(Expr::column(self::ALIAS_USER_TEAM . '.teamId'), $teamsIds);
			default:
				if (is_array($value)) {
					return Cond::in(Expr::column(self::ALIAS_USER . ".$property"), $value);
				}

				return Cond::equal(Expr::column(self::ALIAS_USER . ".$property"), $value);
		}
		if (!$userFieldColumn || !$entityFieldName) {
			throw new \LogicException('User field column or entity field name not set.');
		}
		
		$conditionType = $originalCondition['type'] ?? WhereType::EQUALS;
		if ($conditionType === WhereType::NOT_CONTAINS || $conditionType === WhereType::NOT_IN || $conditionType === WhereType::NOT_EQUALS) {
			return Cond::notEqual(
				Expr::column($userFieldColumn),
				Expr::column($entityFieldName)
			);
		}

		return Cond::equal(
			Expr::column($userFieldColumn),
			Expr::column($entityFieldName)
		);
	}

	/**
	 * @todo: enhance
	 */
	protected function tryJoinLinkField(QueryBuilder $queryBuilder, string $fieldName, ?string $middleTableFieldName = null, ?string $middleTableName = null, ?string $alias = null): string {
		if ($relationType = $this->seedEntity->getRelationType($fieldName)) {
			if ($relationType === 'manyMany') {
				if (!isset($middleTableFieldName, $middleTableName, $alias)) {
					throw new \LogicException("Missing parameters for manyMany relation: '$fieldName'");
				}
				$queryBuilder->leftJoin(
					Join::createWithTableTarget($middleTableName, $alias)
						->withConditions(Cond::and(
							Cond::equal(Expr::column($alias . '.entityId'), Expr::column('id')),
							Cond::equal(Expr::column($alias . '.entityType'), Expr::value($this->entityType)),
							Cond::notEqual(Expr::column($alias . '.deleted'), Expr::value(true))
						))
				);
				$fieldName = $alias . '.' . $middleTableFieldName;
			} else {
				$fieldName .= 'Id';
			}
		}

		return $fieldName;
	}

	/**
	 * @param  QueryBuilder         $queryBuilder
	 * @param  string               $attribute
	 * @param  string               $value
	 * @param  array<string, mixed> $options
	 * @return WhereClauseItem
	 * @internal
	 */
	private function convertConfigAttribute(QueryBuilder $queryBuilder, string $attribute, string $value, array $options): WhereClauseItem {
		if (
			!isset($options[Option::CONFIG]) && !isset($options[Option::INJECTABLE_FACTORY])
		) {
			throw new \LogicException('Neither (options[' . Option::USERS_IDS . ']), nor (options[' . Option::INJECTABLE_FACTORY . ']) is set for $config scope.');
		}
		/** @var InjectableFactory|null $injectableFactory */
		$injectableFactory = $options[Option::INJECTABLE_FACTORY] ?? null;
		if ($injectableFactory) {
			$config = $injectableFactory->create(Config::class);
		} else {
			$config = $options[Option::CONFIG];
		}

		if ($attribute === '$installedExtensions') {
			// we may probably use `extension` table in db, however to keep the dynamic logic consistent across FE & BE we won't do that.
			$installedExtensions = array_keys($config->get('installedExtensions', []));

			return WhereClause::create(Cond::in(Expr::value($value), $installedExtensions));
		}
		$parts = explode('.', $attribute, 2);
		if (count($parts) !== 2) {
			throw new \LogicException("Unsupported attribute: $attribute");
		}

		[$scope, $property] = $parts;
		switch ($scope) {
			case 'settings':
				$configValue = $config->get($property);

				return WhereClause::create(Cond::equal(Expr::value($value), Expr::value($configValue)));
			default:
				throw new \LogicException("Unsupported scope: $scope");
		}
	}

}
