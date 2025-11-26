<?php

namespace Espo\Modules\Viacrm\Classes\Utils\Database\Orm\FieldConverters;

use Espo\Core\Utils\Database\Orm\Defs\AttributeDefs;
use Espo\Core\Utils\Database\Orm\Defs\EntityDefs;
use Espo\Core\Utils\Database\Orm\Defs\RelationDefs;
use Espo\Entities\PhoneNumber;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Defs\FieldDefs;
use Espo\ORM\Type\AttributeType;
use Espo\ORM\Type\RelationType;
use ReflectionException;

class Phone extends \Espo\Core\Utils\Database\Orm\FieldConverters\Phone
{
	private const COLUMN_ENTITY_TYPE_LENGTH = 100;

	/**
	 * @throws ReflectionException
	 */
	public function convert(FieldDefs $fieldDefs, string $entityType): EntityDefs
	{
		$name = $fieldDefs->getName();

		$foreignJoinAlias = "$name$entityType{alias}Foreign";
		$foreignJoinMiddleAlias = "$name$entityType{alias}ForeignMiddle";

		$phoneNumberDefs = AttributeDefs::create($name)
			->withType(AttributeType::VARCHAR)
			->withParamsMerged(
				$this->getPhoneNumberParams($entityType, $foreignJoinAlias, $foreignJoinMiddleAlias)
			);

		$dataDefs = AttributeDefs::create($name . 'Data')
			->withType(AttributeType::JSON_ARRAY)
			->withNotStorable()
			->withParamsMerged([
				'notExportable' => true,
				'isPhoneNumberData' => true,
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

		$numericAttribute = AttributeDefs::create($name . 'Numeric')
			->withType(AttributeType::VARCHAR)
			->withNotStorable()
			->withParamsMerged(
				ReflectionUtil::callClassMethod(self::class, $this, 'getNumericParams', $entityType)
			);

		$relationDefs = RelationDefs::create('phoneNumbers')
			->withType(RelationType::MANY_MANY)
			->withForeignEntityType(PhoneNumber::ENTITY_TYPE)
			->withRelationshipName('entityPhoneNumber')
			->withMidKeys('entityId', 'phoneNumberId')
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
			->withAttribute($phoneNumberDefs)
			->withAttribute($dataDefs)
			->withAttribute($isOptedOutDefs)
			->withAttribute($isInvalidDefs)
			->withAttribute($numericAttribute)
			->withRelation($relationDefs);
	}

	/**
	 * @return array<string, mixed>
	 */
	private function getPhoneNumberParams(
		string $entityType,
		string $foreignJoinAlias,
		string $foreignJoinMiddleAlias,
	): array {
		return [
			'select' => [
				'select' => ['phoneNumbers.name', 'phoneNumbers.accountId'],
				'leftJoins' => [['phoneNumbers', 'phoneNumbers', ['primary' => true]]],
			],
			'selectForeign' => [
				'select' => "$foreignJoinAlias.name",
				'leftJoins' => [
					[
						'EntityPhoneNumber',
						$foreignJoinMiddleAlias,
						[
							"$foreignJoinMiddleAlias.entityId:" => '{alias}.id',
							"$foreignJoinMiddleAlias.primary" => true,
							"$foreignJoinMiddleAlias.deleted" => false,
						],
					],
					[
						PhoneNumber::ENTITY_TYPE,
						$foreignJoinAlias,
						[
							"$foreignJoinAlias.id:" => "$foreignJoinMiddleAlias.phoneNumberId",
							"$foreignJoinAlias.deleted" => false,
						],
					],
				],
			],
			'fieldType' => 'phone',
			'where' => [
				'LIKE' => [
					'whereClause' => [
						'id=s' => [
							'from' => 'EntityPhoneNumber',
							'select' => ['entityId'],
							'joins' => [
								[
									'phoneNumber',
									'phoneNumber',
									[
										'phoneNumber.id:' => 'phoneNumberId',
										'phoneNumber.deleted' => false,
									],
								],
							],
							'whereClause' => [
								'deleted' => false,
								'entityType' => $entityType,
								'phoneNumber.name*' => '{value}',
							],
						],
					],
				],
				'NOT LIKE' => [
					'whereClause' => [
						'id!=s' => [
							'from' => 'EntityPhoneNumber',
							'select' => ['entityId'],
							'joins' => [
								[
									'phoneNumber',
									'phoneNumber',
									[
										'phoneNumber.id:' => 'phoneNumberId',
										'phoneNumber.deleted' => false,
									],
								],
							],
							'whereClause' => [
								'deleted' => false,
								'entityType' => $entityType,
								'phoneNumber.name*' => '{value}',
							],
						],
					],
				],
				'=' => [
					'leftJoins' => [['phoneNumbers', 'phoneNumbersMultiple']],
					'whereClause' => [
						'phoneNumbersMultiple.name=' => '{value}',
					],
				],
				'<>' => [
					'whereClause' => [
						'id!=s' => [
							'from' => 'EntityPhoneNumber',
							'select' => ['entityId'],
							'joins' => [
								[
									'phoneNumber',
									'phoneNumber',
									[
										'phoneNumber.id:' => 'phoneNumberId',
										'phoneNumber.deleted' => false,
									],
								],
							],
							'whereClause' => [
								'deleted' => false,
								'entityType' => $entityType,
								'phoneNumber.name' => '{value}',
							],
						],
					],
				],
				'IN' => [
					'whereClause' => [
						'id=s' => [
							'from' => 'EntityPhoneNumber',
							'select' => ['entityId'],
							'joins' => [
								[
									'phoneNumber',
									'phoneNumber',
									[
										'phoneNumber.id:' => 'phoneNumberId',
										'phoneNumber.deleted' => false,
									],
								],
							],
							'whereClause' => [
								'deleted' => false,
								'entityType' => $entityType,
								'phoneNumber.name' => '{value}',
							],
						],
					],
				],
				'NOT IN' => [
					'whereClause' => [
						'id=s' => [
							'from' => 'EntityPhoneNumber',
							'select' => ['entityId'],
							'joins' => [
								[
									'phoneNumber',
									'phoneNumber',
									[
										'phoneNumber.id:' => 'phoneNumberId',
										'phoneNumber.deleted' => false,
									],
								],
							],
							'whereClause' => [
								'deleted' => false,
								'entityType' => $entityType,
								'phoneNumber.name!=' => '{value}',
							],
						],
					],
				],
				'IS NULL' => [
					'leftJoins' => [['phoneNumbers', 'phoneNumbersMultiple']],
					'whereClause' => [
						'phoneNumbersMultiple.name=' => null,
					],
				],
				'IS NOT NULL' => [
					'whereClause' => [
						'id=s' => [
							'from' => 'EntityPhoneNumber',
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
					['phoneNumbers.name', '{direction}'],
				],
				'leftJoins' => [['phoneNumbers', 'phoneNumbers', ['primary' => true]]],
				'additionalSelect' => ['phoneNumbers.name'],
			],
		];
	}
}
