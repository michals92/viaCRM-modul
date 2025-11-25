<?php

namespace Espo\Modules\Viacrm\Tools\RecordList;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Select\SearchParams;
use Espo\Core\Utils\Metadata;
use Espo\Modules\Viacrm\Tools\Layout\AttributeExtractor;
use Espo\ORM\Defs;
use Espo\ORM\Entity;
use Espo\ORM\Type\AttributeType;

class Loader {

	public function __construct(
		private readonly Service $service,
		private readonly Defs $defs,
		private readonly AttributeExtractor $attributeExtractor,
		private readonly Metadata $metadata,
	) {}

	/**
	 * @throws BadRequest
	 * @throws Forbidden
	 * @throws Error
	 * @throws NotFound
	 */
	public function load(Entity $entity, string $field, bool $forceSelectAllAttributes = false): void {
		$entityType = $entity->getEntityType();

		$entityDefs = $this->defs->getEntity($entityType);
		$foreignEntityType = $entityDefs->getRelation($field)->getForeignEntityType();
		$foreignEntityDefs = $this->defs->getEntity($foreignEntityType);
		$fieldDefs = $entityDefs->getField($field);

		$orderByField = $fieldDefs->getParam('recordListOrderByField');
		$layout = $fieldDefs->getParam('recordListLayout');
		$forceSelectAllAttributes = $fieldDefs->getParam('recordListForceSelectAllAttributes') || $forceSelectAllAttributes;
		$mandatorySelectAttributeList = $fieldDefs->getParam('recordListMandatorySelectAttributeList') ?? [];

		$mandatoryAttributeList = $this->metadata->get(['recordDefs', $foreignEntityType, 'mandatoryAttributeList'], []);

		$mandatorySelectAttributeList = array_unique(array_merge($mandatorySelectAttributeList, $mandatoryAttributeList));

		$searchParams = SearchParams::create();

		if ($layout && !$forceSelectAllAttributes) {
			$attributeList = $this->attributeExtractor->extractAttributesFromLayout($foreignEntityType, $layout);

			if ($mandatorySelectAttributeList) {
				if (empty($attributeList)) {
					throw Error::createWithBody(
						"Entity {$foreignEntityType} is missing layout {$layout} or layout does not contain valid JSON",
						Error\Body::create()
						    ->withMessageTranslation('layoutMissingOrInvalid', 'FieldManager', [
						        'layout' => $layout,
						        'entityType' => $foreignEntityType,
						    ])
						    ->encode()
					);
				}

				$attributeList = array_merge($attributeList, $mandatorySelectAttributeList);
			}

			if ($orderByField) {
				if (!$foreignEntityDefs->hasAttribute($orderByField)) {
					throw Error::createWithBody(
						"Entity {$foreignEntityType} is missing '{$orderByField}' order attribute",
						Error\Body::create()
						    ->withMessageTranslation('orderAttributeMissing', 'FieldManager', [
						        'attribute' => $orderByField,
						        'entityType' => $foreignEntityType,
						    ])
						    ->encode()
					);
				}

				if ($foreignEntityDefs->getAttribute($orderByField)->getType() !== AttributeType::INT) {
					throw Error::createWithBody(
						"Entity {$foreignEntityType} order attribute '{$orderByField}' must be of type 'int'",
						Error\Body::create()
						    ->withMessageTranslation('orderAttributeWrongType', 'FieldManager', [
						        'attribute' => $orderByField,
						        'entityType' => $foreignEntityType,
						    ])
						    ->encode()
					);
				}

				$attributeList[] = $orderByField;

				$searchParams = $searchParams
				    ->withOrderBy($orderByField)
				    ->withOrder(SearchParams::ORDER_ASC);
			}

			if ($attributeList) {
				$searchParams = $searchParams->withSelect($attributeList);
			}
		}

		try {
			$recordCollection = $this->service->obtain(
				$entityType,
				$entity->getId(),
				$field,
				$searchParams,
			);
		} catch (Forbidden) {
			return;
		}

		$valueMapList = $recordCollection->getValueMapList();

		$attributeName = $field . 'RecordList';

		if (!$entity->isNew() && !$entity->hasFetched($attributeName)) {
			$entity->setFetched($attributeName, $valueMapList);
		}

		$entity->set($attributeName, $valueMapList);
	}

}
