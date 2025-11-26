<?php

namespace Espo\Modules\Viacrm\Classes\Utils\Database\Orm\FieldConverters;

use Espo\Core\Utils\Database\Orm\Defs\AttributeDefs;
use Espo\Core\Utils\Database\Orm\Defs\EntityDefs;
use Espo\Core\Utils\Database\Orm\Defs\RelationDefs;
use Espo\Entities\EmailAddress;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Defs\FieldDefs;
use Espo\ORM\Type\AttributeType;
use Espo\ORM\Type\RelationType;
use ReflectionException;

class Email extends \Espo\Core\Utils\Database\Orm\FieldConverters\Email
{
	private const COLUMN_ENTITY_TYPE_LENGTH = 100;

	/**
	 * accountEmailAddresses in EmailAddress entity mustn't be changed to emailAddresses.
	 *
	 * @throws ReflectionException
	 */
	public function convert(FieldDefs $fieldDefs, string $entityType): EntityDefs
	{
		$name = $fieldDefs->getName();

		$foreignJoinAlias = "$name$entityType{alias}Foreign";
		$foreignJoinMiddleAlias = "$name$entityType{alias}ForeignMiddle";

		$emailAddressDefs = AttributeDefs::create($name)
			->withType(AttributeType::VARCHAR)
			->withParamsMerged(
				$this->getEmailAddressParams($entityType, $foreignJoinAlias, $foreignJoinMiddleAlias)
			);

		$dataDefs = AttributeDefs::create($name . 'Data')
			->withType(AttributeType::JSON_ARRAY)
			->withNotStorable()
			->withParamsMerged([
				'notExportable' => true,
				'isEmailAddressData' => true,
				'field' => $name,
			]);

		$isOptedOutDefs = AttributeDefs::create($name . 'IsOptedOut')
			->withType(AttributeType::BOOL)
			->withNotStorable()
			->withParamsMerged(
				ReflectionUtil::callClassMethod(self::class, $this, 'getIsOptedOutParams', $foreignJoinAlias, $foreignJoinMiddleAlias)
			);

		$isInvalidDefs = AttributeDefs::create($name . 'IsInvalid')
			->withType(AttributeType::BOOL)
			->withNotStorable()
			->withParamsMerged(
				ReflectionUtil::callClassMethod(self::class, $this, 'getIsInvalidParams', $foreignJoinAlias, $foreignJoinMiddleAlias)
			);

		$relationDefs = RelationDefs::create('emailAddresses')
			->withType(RelationType::MANY_MANY)
			->withForeignEntityType(EmailAddress::ENTITY_TYPE)
			->withRelationshipName('entityEmailAddress')
			->withMidKeys('entityId', 'emailAddressId')
			->withConditions(['entityType' => $entityType])
			->withAdditionalColumn(
				AttributeDefs::create('entityType')
					->withType(AttributeType::VARCHAR)
					->withLength(self::COLUMN_ENTITY_TYPE_LENGTH)
			)
			->withAdditionalColumn(
				AttributeDefs::create('primary')
					->withType(AttributeType::BOOL)
					->withDefault(false)
			)
			->withAdditionalColumn(
				AttributeDefs::create('accountId')
					->withType(AttributeType::VARCHAR)
					->withLength(24)
					->withDefault(null)
			);

		return EntityDefs::create()
			->withAttribute($emailAddressDefs)
			->withAttribute($dataDefs)
			->withAttribute($isOptedOutDefs)
			->withAttribute($isInvalidDefs)
			->withRelation($relationDefs);
	}

	/**
	 * @return array<string, mixed>
	 */
	private function getEmailAddressParams(
		string $entityType,
		string $foreignJoinAlias,
		string $foreignJoinMiddleAlias,
	): array {
		return [
			'select' => [
				'select' => ['emailAddresses.name', 'emailAddresses.accountId'],
				'leftJoins' => [['emailAddresses', 'emailAddresses', ['primary' => true]]],
			],
			'selectForeign' => [
				'select' => "$foreignJoinAlias.name",
				'leftJoins' => [
					[
						'EntityEmailAddress',
						$foreignJoinMiddleAlias,
						[
							"$foreignJoinMiddleAlias.entityId:" => '{alias}.id',
							"$foreignJoinMiddleAlias.primary" => true,
							"$foreignJoinMiddleAlias.deleted" => false,
						],
					],
					[
						EmailAddress::ENTITY_TYPE,
						$foreignJoinAlias,
						[
							"$foreignJoinAlias.id:" => "$foreignJoinMiddleAlias.emailAddressId",
							"$foreignJoinAlias.deleted" => false,
						],
					],
				],
			],
			'fieldType' => 'email',
			'where' => [
				'LIKE' => [
					'whereClause' => [
						'id=s' => [
							'from' => 'EntityEmailAddress',
							'select' => ['entityId'],
							'joins' => [
								[
									'emailAddress',
									'emailAddress',
									[
										'emailAddress.id:' => 'emailAddressId',
										'emailAddress.deleted' => false,
									],
								],
							],
							'whereClause' => [
								'deleted' => false,
								'entityType' => $entityType,
								'LIKE:(emailAddress.lower, LOWER:({value})):' => null,
							],
						],
					],
				],
				'NOT LIKE' => [
					'whereClause' => [
						'id!=s' => [
							'from' => 'EntityEmailAddress',
							'select' => ['entityId'],
							'joins' => [
								[
									'emailAddress',
									'emailAddress',
									[
										'emailAddress.id:' => 'emailAddressId',
										'emailAddress.deleted' => false,
									],
								],
							],
							'whereClause' => [
								'deleted' => false,
								'entityType' => $entityType,
								'LIKE:(emailAddress.lower, LOWER:({value})):' => null,
							],
						],
					],
				],
				'=' => [
					'leftJoins' => [['emailAddresses', 'emailAddressesMultiple']],
					'whereClause' => [
						'EQUAL:(emailAddressesMultiple.lower, LOWER:({value})):' => null,
					],
				],
				'<>' => [
					'leftJoins' => [['emailAddresses', 'emailAddressesMultiple']],
					'whereClause' => [
						'NOT_EQUAL:(emailAddressesMultiple.lower, LOWER:({value})):' => null,
					],
					'distinct' => true,
				],
				'IN' => [
					'leftJoins' => [['emailAddresses', 'emailAddressesMultiple']],
					'whereClause' => [
						'EQUAL:(emailAddressesMultiple.lower, LOWER:({value})):' => null,
					],
					'distinct' => true,
				],
				'NOT IN' => [
					'leftJoins' => [['emailAddresses', 'emailAddressesMultiple']],
					'whereClause' => [
						'NOT_EQUAL:(emailAddressesMultiple.lower, LOWER:({value})):' => null,
					],
					'distinct' => true,
				],
				'IS NULL' => [
					'leftJoins' => [['emailAddresses', 'emailAddressesMultiple']],
					'whereClause' => [
						'emailAddressesMultiple.lower=' => null,
					],
					'distinct' => true,
				],
				'IS NOT NULL' => [
					'whereClause' => [
						'id=s' => [
							'from' => 'EntityEmailAddress',
							'select' => ['entityId'],
							'whereClause' => [
								'deleted' => false,
								'entityType' => $entityType,
							],
						],
					],
				],
			],
			'order' => [
				'order' => [
					['emailAddresses.lower', '{direction}'],
				],
				'leftJoins' => [['emailAddresses', 'emailAddresses', ['primary' => true]]],
				'additionalSelect' => ['emailAddresses.lower'],
			],
		];
	}
}
