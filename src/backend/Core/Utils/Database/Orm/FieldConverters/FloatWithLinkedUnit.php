<?php

namespace Espo\Modules\Autocrm\Core\Utils\Database\Orm\FieldConverters;

use Espo\Core\Utils\Database\Orm\Defs\AttributeDefs;
use Espo\Core\Utils\Database\Orm\Defs\EntityDefs;
use Espo\Core\Utils\Database\Orm\FieldConverter;
use Espo\ORM\Defs\FieldDefs;
use Espo\ORM\Type\AttributeType;

/**
 * Field converter for floatWithLinkedUnit type.
 * Similar to floatWithUnit but supports dynamic units from linked entities.
 *
 * Usage in metadata:
 * "quantity": {
 *   "type": "floatWithLinkedUnit",
 *   "unitField": "measureUnit",        // Field name on linked entity with unit value
 *   "unitLinkName": "product",         // Link name to entity with unit
 * }
 */
class FloatWithLinkedUnit implements FieldConverter {

	public function convert(FieldDefs $fieldDefs, string $entityType): EntityDefs {
		$name = $fieldDefs->getName();
		$unitField = $fieldDefs->getParam('unitField');
		$unitLinkName = $fieldDefs->getParam('unitLinkName');

		// Value attribute (the float number)
		$valueDefs = AttributeDefs::create($name)
		    ->withType(AttributeType::FLOAT)
		    ->withParamsMerged([
		        'attributeRole' => 'value',
		        'fieldType' => 'floatWithLinkedUnit',
		    ]);

		// Unit attribute (stores the actual unit string)
		$unitDefs = AttributeDefs::create($name . 'Unit')
		    ->withType(AttributeType::VARCHAR)
		    ->withParamsMerged([
		        'attributeRole' => 'unit',
		        'fieldType' => 'floatWithLinkedUnit',
		    ]);

		// Handle notStorable flag
		if ($fieldDefs->isNotStorable()) {
			$valueDefs = $valueDefs->withNotStorable();
			$unitDefs = $unitDefs->withNotStorable();
		}

		$entityDefs = EntityDefs::create()
		    ->withAttribute($valueDefs)
		    ->withAttribute($unitDefs);

		// Add shared FOREIGN attribute for the link (e.g., productMeasureUnit)
		// This is shared by ALL floatWithLinkedUnit fields using the same link+field combination
		// Eliminates N+1 queries - one attribute serves multiple fields
		if ($unitField && $unitLinkName) {
			// Create shared attribute name: {linkName}{CapitalizedFieldName}
			// Example: link="product", field="measureUnit" → "productMeasureUnit"
			$sharedAttributeName = $unitLinkName . ucfirst($unitField);

			// Create alias for LEFT JOIN (must be unique but consistent)
			$alias = $sharedAttributeName . 'Foreign';

			// Define LEFT JOIN (following Currency pattern)
			$leftJoins = [
				[
					$unitLinkName,  // Relation name
					$alias,         // Alias
					[
						$alias . '.id:' => $unitLinkName . 'Id'  // Join condition
					]
				]
			];

			// Create FOREIGN attribute with explicit LEFT JOIN definition
			$sharedForeignDefs = AttributeDefs::create($sharedAttributeName)
			    ->withType(AttributeType::FOREIGN)
			    ->withNotStorable()
			    ->withParamsMerged([
			        'relation' => $unitLinkName,   // Link name (e.g., 'product')
			        'foreign' => $unitField,       // Field on linked entity (e.g., 'measureUnit')
			        'attributeRole' => 'foreign',
			        'select' => [
			            'select' => $alias . '.' . $unitField,  // SELECT alias.measureUnit
			            'leftJoins' => $leftJoins,               // Explicit LEFT JOIN
			        ],
			    ]);

			$entityDefs = $entityDefs->withAttribute($sharedForeignDefs);
		}

		return $entityDefs;
	}

}
