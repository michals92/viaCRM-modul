<?php

namespace Espo\Modules\Viacrm\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Utils\Metadata;

class ColorizationDefs implements Action {

	public function __construct(
		private readonly Metadata $metadata
	) {}

	/**
	 * Processes the PUT request to update colorization definitions.
	 *
	 * @param  Request    $request
	 * @throws BadRequest
	 * @return Response
	 */
	public function process(Request $request): Response {
		$data = $request->getParsedBody();

		if (
			empty($data->entityType) ||
			!isset($data->rules)
		) {
			throw new BadRequest('Missing required fields: entityType and rules are required.');
		}

		$entityType = $data->entityType;
		$rules = $data->rules;

		$colorizationData = $this->metadata->getCustom('colorizationDefs', $entityType, (object)[]);

		$colorizationData->rules = $rules;

		$this->metadata->saveCustom('colorizationDefs', $entityType, $colorizationData);

		return ResponseComposer::json(true);
	}

}
