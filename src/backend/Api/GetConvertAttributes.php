<?php

namespace Espo\Modules\Autocrm\Api;

use Espo\Core\Acl;
use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\InternalServerError;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Record\ReadParams;
use Espo\Core\Record\ServiceContainer;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Metadata;

readonly class GetConvertAttributes implements Action {

	public function __construct(
		private Acl              $acl,
		private EntityManager    $entityManager,
		private Metadata         $metadata,
		private ServiceContainer $serviceContainer
	) {}

	/**
	 * Processes the GET request to fetch conversion attributes.
	 *
	 * @param  Request             $request
	 * @throws NotFound
	 * @throws InternalServerError
	 * @throws BadRequest
	 * @throws Error*@throws \JsonException
	 * @throws Forbidden
	 * @throws \JsonException
	 * @return Response
	 */
	public function process(Request $request): Response {
		// Retrieve route parameters
		$entityType = $request->getRouteParam('entityType');
		$id = $request->getRouteParam('id');
		$foreignScope = $request->getRouteParam('foreignScope');

		// Validate required parameters
		if (!$entityType || !$id || !$foreignScope) {
			throw new BadRequest('Missing required route parameters: entityType, id, and foreignScope are required.');
		}

		// Check if the user has read access to the entity
		if (!$this->acl->check($entityType, 'read')) {
			throw new Forbidden('No read access for the specified entity type.');
		}

		// Fetch the entity
		$entity = $this
			->serviceContainer
			->get($entityType)
			->read($id, ReadParams::create());

		$isCustom = false;
		$conversionDefs = JSON::decode(JSON::encode($this->metadata->get(['conversionDefs', $entityType])));

		if (!$conversionDefs) {
			$conversionDefs = $this->metadata->getCustom('conversionDefs', $entityType, (object)[]);
			$isCustom = true;
		}

		if (!isset($conversionDefs->$foreignScope)) {
			throw new NotFound("Conversion definitions for foreign scope '$foreignScope' not found in scope '$entityType'. defs: ");
		}

		$attributesData = $conversionDefs->$foreignScope;

		// Validate the structure of attributesData
		if (!isset($attributesData->fieldList)) {
			throw new InternalServerError("Missing 'fieldList' property in conversion attributes for foreign scope '{$foreignScope}'.");
		}
		if (!is_array($attributesData->fieldList)) {
			throw new InternalServerError("Property 'fieldList' must be array, got " . gettype($attributesData->fieldList) . " in conversion attributes for foreign scope '{$foreignScope}'.");
		}
		if (!isset($attributesData->fields)) {
			throw new InternalServerError("Missing 'fields' property in conversion attributes for foreign scope '{$foreignScope}'.");
		}
		if (!is_object($attributesData->fields)) {
			throw new InternalServerError("Property 'fields' must be object, got " . gettype($attributesData->fields) . " in conversion attributes for foreign scope '{$foreignScope}'.");
		}

		// Initialize attributes
		$attributes = [];

		// Iterate through each field in fieldList
		foreach ($attributesData->fieldList as $fieldName) {
			if (!isset($attributesData->fields->$fieldName)) {
				throw new InternalServerError("Field '{$fieldName}' is listed in fieldList but not defined in fields.");
			}

			$fieldDef = $attributesData->fields->$fieldName;

			if (!isset($fieldDef->subjectType)) {
				throw new InternalServerError("Field '{$fieldName}' does not have a subjectType defined.");
			}

			$subjectType = $fieldDef->subjectType;
			switch ($subjectType) {
				case 'field':
					// Handle fields of subjectType 'field'
					if (!isset($fieldDef->field)) {
						throw new InternalServerError("Field '{$fieldName}' of type 'field' does not specify the 'field' key.");
					}
					$foreignFieldName = $fieldDef->field;
					// Get field type from metadata
					$field = $this->metadata->get(['entityDefs', $entityType, 'fields', $foreignFieldName], null);
					if (empty($field)) {
						if (
							$entity->hasAttribute($foreignFieldName)
						) {
							$attributes[$fieldName] = $entity->get($foreignFieldName);
							break;
						}

						throw new InternalServerError("Field definition not found for field name '{$foreignFieldName}' in conversion attributes for scope '{$entityType}'.");
					}
					$fieldType = $field['type'];
					$recordListEnabled = $field['recordListEnabled'] ?? false;

					$fieldToGet = $fieldType === 'linkMultiple' && $recordListEnabled
						? $fieldDef->field . 'RecordList'
						: $fieldDef->field;

					$fieldValue = $entity->get($fieldToGet);

					if ($fieldType === 'linkMultiple' && $recordListEnabled) {
						foreach ($fieldValue as &$item) {
							if (isset($item->id)) {
								unset($item->id);
							}
						}
						$attributes[$fieldName . 'RecordList'] = $fieldValue;
					} else {
						$attributes[$fieldName] = $fieldValue;
					}

					break;

				case 'value':
					// Handle fields of subjectType 'value'
					if (!isset($fieldDef->attributes) || !is_object($fieldDef->attributes)) {
						throw new InternalServerError("Field '{$fieldName}' of type 'value' must have an 'attributes' array.");
					}
					$attributes = array_merge($attributes, (array)$fieldDef->attributes);
					break;

					// Add more cases here if there are other subjectTypes
				default:
					throw new InternalServerError("Unknown subjectType '{$subjectType}' for field '{$fieldName}'.");
			}
		}

		// Prepare the response
		return ResponseComposer::json($attributes);
	}

}
