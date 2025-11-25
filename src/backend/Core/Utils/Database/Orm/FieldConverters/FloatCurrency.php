<?php

namespace Espo\Modules\Viacrm\Core\Utils\Database\Orm\FieldConverters;

use Espo\Core\Currency\ConfigDataProvider;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Database\Orm\Defs\AttributeDefs;
use Espo\Core\Utils\Database\Orm\Defs\EntityDefs;
use Espo\Core\Utils\Database\Orm\FieldConverter;
use Espo\Core\Utils\Metadata;
use Espo\ORM\Defs\FieldDefs;
use Espo\ORM\Query\Part\Expression as Expr;
use Espo\ORM\Type\AttributeType;

class FloatCurrency implements FieldConverter {

	// replace with AttributeParam::NOT_STORABLE in espo 9
	public const NOT_STORABLE = 'notStorable';
	public const DEFAULT_PRECISION = 13;
	public const DEFAULT_SCALE = 4;

	public function __construct(
		private readonly Metadata $metadata,
		private readonly Config $config,
		private readonly ConfigDataProvider $configDataProvider
	) {}

	public function convert(FieldDefs $fieldDefs, string $entityType): EntityDefs {
		$name = $fieldDefs->getName();

		// Create the main attribute - follow the same pattern as currency converter
		$amountDefs = AttributeDefs::create($name)
			->withType(AttributeType::FLOAT)
			->withParamsMerged([
				'attributeRole' => 'value',
				'fieldType' => 'floatType',
			]);

		// Handle decimal mode like currency converter
		if ($fieldDefs->getParam('decimal')) {
			$dbType = $fieldDefs->getParam('dbType') ?? 'DECIMAL';
			$precision = $fieldDefs->getParam('precision') ?? self::DEFAULT_PRECISION;
			$scale = $fieldDefs->getParam('scale') ?? self::DEFAULT_SCALE;

			$amountDefs = $amountDefs
				->withType(AttributeType::VARCHAR)
				->withDbType($dbType)
				->withParam('precision', $precision)
				->withParam('scale', $scale);
		}

		if ($fieldDefs->isNotStorable()) {
			$amountDefs = $amountDefs->withNotStorable();
		}

		// Create currency attribute - MUST use fieldType 'currency' for symbol generation
		$currencyDefs = AttributeDefs::create($name . 'Currency')
			->withType(AttributeType::VARCHAR)
			->withNotStorable()
			->withParamsMerged([
				'attributeRole' => 'currency',
				'fieldType' => 'currency', // Required for automatic {field}CurrencySymbol generation
			]);

		// Handle currency from parent via joins
		$parentLinkName = $fieldDefs->getParam('parentLinkName');
		$currencyField = $fieldDefs->getParam('currencyField') ?? 'amountCurrency';

		if ($parentLinkName) {
			// Handle linkParent fields specially
			if ($this->isLinkParent($entityType, $parentLinkName)) {
				$entityList = $this->metadata->get(['entityDefs', $entityType, 'fields', $parentLinkName, 'entityList']) ?? [];

				if (!empty($entityList)) {
					// For linkParent with entityList, we can create a CASE expression to get currency from the right parent
					$this->handleLinkParentCurrency($currencyDefs, $parentLinkName, $entityList, $currencyField, $entityType);

					$convertedDefs = $this->createConvertedAttribute($fieldDefs, $parentLinkName, $currencyField, $entityType);

					$entityDefs = EntityDefs::create()
						->withAttribute($amountDefs)
						->withAttribute($currencyDefs);

					return $entityDefs->withAttribute($convertedDefs);
				}

				// If no entityList, skip currency from parent
				$convertedDefs = $this->createConvertedAttribute($fieldDefs, $parentLinkName, $currencyField, $entityType);

				$entityDefs = EntityDefs::create()
					->withAttribute($amountDefs)
					->withAttribute($currencyDefs);

				return $entityDefs->withAttribute($convertedDefs);
			}
			$this->validateLinkName($parentLinkName);
			$this->validateFieldName($currencyField);

			// Use safe alias generation
			$alias = $this->createAlias($parentLinkName);
			$parentEntity = $this->getParentEntityType($entityType, $parentLinkName);

			$leftJoins = [
				[
					$parentEntity,
					$alias,
					[$alias . '.id:' => $parentLinkName . 'Id'],
				],
			];

			// Use Expression API for safe column references
			$selectExpression = Expr::column($alias . '.' . $currencyField)->getValue();
			// Note: {alias} placeholders are template variables, keep as string
			$foreignSelectExpression = $alias . '{alias}Foreign.' . $currencyField;

			// Add virtual selection that populates the stored currency field
			$currencyDefs = $currencyDefs
				->withParamsMerged([
					'select' => [
						'select' => $selectExpression,
						'leftJoins' => $leftJoins,
					],
					'selectForeign' => [
						'select' => $foreignSelectExpression,
						'leftJoins' => [
							[
								$parentEntity,
								$alias . '{alias}Foreign',
								[$alias . '{alias}Foreign.id:' => '{alias}.' . $parentLinkName . 'Id'],
							],
						],
					],
					'where' => [
						'=' => [
							'whereClause' => [$alias . '.' . $currencyField . '=' => '{value}'],
							'leftJoins' => $leftJoins,
						],
						'<>' => [
							'whereClause' => [$alias . '.' . $currencyField . '!=' => '{value}'],
							'leftJoins' => $leftJoins,
						],
						'IS NULL' => [
							'whereClause' => [$alias . '.' . $currencyField . '=' => null],
							'leftJoins' => $leftJoins,
						],
						'IS NOT NULL' => [
							'whereClause' => [$alias . '.' . $currencyField . '!=' => null],
							'leftJoins' => $leftJoins,
						],
					],
					'order' => [
						'order' => [
							[$alias . '.' . $currencyField, '{direction}'],
						],
						'leftJoins' => $leftJoins,
					],
				]);
		} else {
			// If currencyField not provided, mark as notStorable and let AdditionalApplier populate it
			if (!$fieldDefs->hasParam('currencyField')) {
				$currencyDefs = $currencyDefs->withNotStorable();
			} else {
				$currencyDefs = $currencyDefs->withParamsMerged([
					'select' => [
						'select' => $currencyField,
					],
				]);
			}
		}

		$convertedDefs = null;

		// Generate converted attribute for currency conversion like the Currency converter
		// Skip if currency field is not provided (will be populated by AdditionalApplier)
		if (!$fieldDefs->isNotStorable() && ($fieldDefs->hasParam('currencyField') || $parentLinkName)) {
			$convertedDefs = $this->createConvertedAttribute($fieldDefs, $parentLinkName, $currencyField, $entityType);
		}

		$entityDefs = EntityDefs::create()
			->withAttribute($amountDefs)
			->withAttribute($currencyDefs);

		if ($convertedDefs) {
			$entityDefs = $entityDefs->withAttribute($convertedDefs);
		}

		return $entityDefs;
	}

	private function validateLinkName(string $linkName): void {
		if (!preg_match('/^[a-zA-Z][a-zA-Z0-9_]*$/', $linkName)) {
			throw new \InvalidArgumentException("Invalid link name: {$linkName}");
		}
	}

	private function validateFieldName(string $fieldName): void {
		if (!preg_match('/^[a-zA-Z][a-zA-Z0-9_]*$/', $fieldName)) {
			throw new \InvalidArgumentException("Invalid field name: {$fieldName}");
		}
	}

	private function createAlias(string $linkName): string {
		// Create safe alias by validating and sanitizing
		$this->validateLinkName($linkName);

		return $linkName . 'CurrencyJoin';
	}

	private function getParentEntityType(string $entityType, string $linkName): string {
		$this->validateLinkName($linkName);

		if ($this->isLinkParent($entityType, $linkName)) {
			throw new \LogicException('Cannot determine parent entity type for linkParent field');
		}

		$linkEntityType = $this->metadata->get(['entityDefs', $entityType, 'links', $linkName, 'entity']);

		if ($linkEntityType) {
			return $linkEntityType;
		}

		return ucfirst($linkName);
	}

	private function isLinkParent(string $entityType, string $linkName): bool {
		$fieldType = $this->metadata->get(['entityDefs', $entityType, 'fields', $linkName, 'type']);

		return $fieldType === 'linkParent';
	}

	/**
	 * @param string[] $entityList
	 */
	private function handleLinkParentCurrency(AttributeDefs &$currencyDefs, string $parentLinkName, array $entityList, string $currencyField, string $entityType): void {
		$this->validateLinkName($parentLinkName);
		$this->validateFieldName($currencyField);

		$tableAlias = lcfirst($entityType);

		$caseConditions = [];
		$leftJoins = [];

		foreach ($entityList as $parentEntityType) {
			$parentHasCurrencyField = $this->metadata->get(['entityDefs', $parentEntityType, 'fields', $currencyField]) !== null;

			if ($parentHasCurrencyField) {
				$alias = $parentLinkName . $parentEntityType . 'Join';

				$caseConditions[] = [
					'entityType' => $parentEntityType,
					'alias' => $alias,
					'currencyField' => $currencyField,
				];

				$leftJoins[] = [
					$parentEntityType,
					$alias,
					[
						$alias . '.id:' => $parentLinkName . 'Id',
					],
				];
			}
		}

		// Use camelCase for Expression::column() - it doesn't accept underscores
		$parentTypeColumn = $parentLinkName . 'Type';

		$defaultCurrency = $this->config->get('baseCurrency');

		// Build the expression using Expression API
		$expression = $this->buildLinkParentCurrencyExpression(
			$tableAlias,
			$parentTypeColumn,
			$caseConditions,
			$defaultCurrency
		);

		$currencyDefs = $currencyDefs
			->withParamsMerged([
				'select' => [
					'select' => $expression->getValue(),
					'leftJoins' => $leftJoins,
				],
			]);
	}

	/**
	 * Build currency expression for linkParent fields using Expression API
	 *
	 * @param array<array{entityType: string, alias: string, currencyField: string}> $conditions
	 */
	private function buildLinkParentCurrencyExpression(
		string $tableAlias,
		string $parentTypeColumn,
		array $conditions,
		string $defaultCurrency
	): Expr {
		// Use Expression::map to create a CASE expression that maps parent types to currency values
		$parentTypeColumnExpr = Expr::column($tableAlias . '.' . $parentTypeColumn);

		// Build arguments for the map function
		$mapArgs = [$parentTypeColumnExpr];

		foreach ($conditions as $condition) {
			// Add the entity type as the key
			$mapArgs[] = $condition['entityType'];
			// Add the currency column reference as the value
			// Use camelCase for Expression::column() - it doesn't accept underscores
			$columnName = $condition['currencyField'];
			$fullColumnName = $condition['alias'] . '.' . $columnName;

			$mapArgs[] = Expr::column($fullColumnName);
		}

		// Add the default currency as the final ELSE value
		$mapArgs[] = $defaultCurrency;

		return Expr::map(...$mapArgs);
	}

	/**
	 * Create the converted attribute for currency conversion
	 */
	private function createConvertedAttribute(FieldDefs $fieldDefs, ?string $parentLinkName, string $currencyField, string $entityType): AttributeDefs {
		if ($this->config->get('currencyNoJoinMode')) {
			return $this->applyNoJoinMode($fieldDefs);
		}

		// Use join mode for currency conversion
		return $this->applyJoinMode($fieldDefs, $parentLinkName, $currencyField, $entityType);
	}

	/**
	 * Apply no-join mode for converted attribute (similar to Currency converter)
	 */
	private function applyNoJoinMode(FieldDefs $fieldDefs): AttributeDefs {
		$name = $fieldDefs->getName();
		$currencyAttribute = $name . 'Currency';

		$defaultCurrency = $this->configDataProvider->getDefaultCurrency();
		$baseCurrency = $this->configDataProvider->getBaseCurrency();
		$rates = $this->configDataProvider->getCurrencyRates()->toAssoc();

		if ($defaultCurrency !== $baseCurrency) {
			$rates = $this->exchangeRates($baseCurrency, $defaultCurrency, $rates);
		}

		$expr = Expr::multiply(
			Expr::column($name),
			Expr::if(
				Expr::equal(Expr::column($currencyAttribute), $defaultCurrency),
				1.0,
				$this->buildExpression($currencyAttribute, $rates)
			)
		)->getValue();

		$exprForeign = Expr::multiply(
			Expr::column("ALIAS.{$name}"),
			Expr::if(
				Expr::equal(Expr::column("ALIAS.{$name}Currency"), $defaultCurrency),
				1.0,
				$this->buildExpression("ALIAS.{$name}Currency", $rates)
			)
		)->getValue();

		$exprForeign = str_replace('ALIAS', '{alias}', $exprForeign);

		return AttributeDefs::create($name . 'Converted')
			->withType(AttributeType::FLOAT)
			->withParamsMerged([
				'select' => [
					'select' => $expr,
				],
				'selectForeign' => [
					'select' => $exprForeign,
				],
				'where' => [
					'=' => [
						'whereClause' => [
							$expr . '=' => '{value}',
						],
					],
					'>' => [
						'whereClause' => [
							$expr . '>' => '{value}',
						],
					],
					'<' => [
						'whereClause' => [
							$expr . '<' => '{value}',
						],
					],
					'>=' => [
						'whereClause' => [
							$expr . '>=' => '{value}',
						],
					],
					'<=' => [
						'whereClause' => [
							$expr . '<=' => '{value}',
						],
					],
					'<>' => [
						'whereClause' => [
							$expr . '!=' => '{value}',
						],
					],
					'IS NULL' => [
						'whereClause' => [
							$expr . '=' => null,
						],
					],
					'IS NOT NULL' => [
						'whereClause' => [
							$expr . '!=' => null,
						],
					],
				],
				self::NOT_STORABLE => true,
				'order' => [
					'order' => [
						[$expr, '{direction}'],
					],
				],
				'attributeRole' => 'valueConverted',
				'fieldType' => 'floatType',
			]);
	}

	/**
	 * Apply join mode for converted attribute (similar to Currency converter)
	 */
	private function applyJoinMode(FieldDefs $fieldDefs, ?string $parentLinkName, string $currencyField, string $entityType): AttributeDefs {
		$name = $fieldDefs->getName();

		$alias = $name . 'CurrencyRate';
		$leftJoins = [];
		
		// If currency is from parent, we need to join the parent entity first
		if ($parentLinkName && !$this->isLinkParent($entityType, $parentLinkName)) {
			$parentAlias = $this->createAlias($parentLinkName);
			$parentEntity = $this->getParentEntityType($entityType, $parentLinkName);
			
			// First join the parent entity
			$leftJoins[] = [
				$parentEntity,
				$parentAlias,
				[$parentAlias . '.id:' => $parentLinkName . 'Id'],
			];
			
			// Then join Currency based on parent's currency field
			$leftJoins[] = [
				'Currency',
				$alias,
				[$alias . '.id:' => $parentAlias . '.' . $currencyField],
			];
		} else {
			// Standard join when currency is stored on the entity itself
			$leftJoins[] = [
				'Currency',
				$alias,
				[$alias . '.id:' => $name . 'Currency'],
			];
		}
		$foreignCurrencyAlias = "{$alias}{$entityType}{alias}Foreign";
		$mulExpression = "MUL:({$name}, {$alias}.rate)";

		return AttributeDefs::create($name . 'Converted')
			->withType(AttributeType::FLOAT)
			->withParamsMerged([
				'select' => [
					'select' => $mulExpression,
					'leftJoins' => $leftJoins,
				],
				'selectForeign' => [
					'select' => "MUL:({alias}.{$name}, {$foreignCurrencyAlias}.rate)",
					'leftJoins' => [
						[
							'Currency',
							$foreignCurrencyAlias,
							[$foreignCurrencyAlias . '.id:' => "{alias}.{$name}Currency"],
						],
					],
				],
				'where' => [
					'=' => [
						'whereClause' => [$mulExpression . '=' => '{value}'],
						'leftJoins' => $leftJoins,
					],
					'>' => [
						'whereClause' => [$mulExpression . '>' => '{value}'],
						'leftJoins' => $leftJoins,
					],
					'<' => [
						'whereClause' => [$mulExpression . '<' => '{value}'],
						'leftJoins' => $leftJoins,
					],
					'>=' => [
						'whereClause' => [$mulExpression . '>=' => '{value}'],
						'leftJoins' => $leftJoins,
					],
					'<=' => [
						'whereClause' => [$mulExpression . '<=' => '{value}'],
						'leftJoins' => $leftJoins,
					],
					'<>' => [
						'whereClause' => [$mulExpression . '!=' => '{value}'],
						'leftJoins' => $leftJoins,
					],
					'IS NULL' => [
						'whereClause' => [$name . '=' => null],
					],
					'IS NOT NULL' => [
						'whereClause' => [$name . '!=' => null],
					],
				],
				self::NOT_STORABLE => true,
				'order' => [
					'order' => [
						[$mulExpression, '{direction}'],
					],
					'leftJoins' => $leftJoins,
					'additionalSelect' => ["{$alias}.rate"],
				],
				'attributeRole' => 'valueConverted',
				'fieldType' => 'floatType',
			]);
	}

	/**
	 * Exchange rates (copied from Currency converter)
	 *
	 * @param array<string, float> $currencyRates
	 *
	 * @return array<string, float>
	 */
	private function exchangeRates(string $baseCurrency, string $defaultCurrency, array $currencyRates): array {
		$precision = 5;
		$defaultCurrencyRate = round(1 / $currencyRates[$defaultCurrency], $precision);

		$exchangedRates = [];
		$exchangedRates[$baseCurrency] = $defaultCurrencyRate;

		unset($currencyRates[$baseCurrency], $currencyRates[$defaultCurrency]);

		foreach ($currencyRates as $currencyName => $rate) {
			$exchangedRates[$currencyName] = round($rate * $defaultCurrencyRate, $precision);
		}

		return $exchangedRates;
	}

	/**
	 * Build expression for currency conversion (copied from Currency converter)
	 *
	 * @param array<string, float> $rates
	 */
	private function buildExpression(string $currencyAttribute, array $rates): Expr|float {
		if ($rates === []) {
			return 0.0;
		}

		$currency = array_key_first($rates);
		$value = $rates[$currency];
		unset($rates[$currency]);

		return Expr::if(
			Expr::equal(Expr::column($currencyAttribute), $currency),
			$value,
			$this->buildExpression($currencyAttribute, $rates)
		);
	}

}
