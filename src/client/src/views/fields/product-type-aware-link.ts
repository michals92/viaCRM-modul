import type AttributeAwareLinkView from 'viacrm:views/fields/attribute-aware-link';

/**
 * Product type-aware link field
 *
 * Link field that automatically loads and syncs the 'type' attribute from Product entity.
 * Stores the type in {fieldName}Type field (e.g., productType).
 *
 * @extends viacrm:views/fields/attribute-aware-link
 */
define(
	['viacrm:views/fields/attribute-aware-link'],
	(Dep: typeof AttributeAwareLinkView) => class extends Dep {
		attributeName = 'type';
	},
);
