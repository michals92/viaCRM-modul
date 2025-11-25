<?php

namespace Espo\Modules\Viacrm\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Utils\Metadata;

readonly class ConversionDefs implements Action {

	public function __construct(
		private Metadata $metadata
	) {}

	/**
	 * Processes the PUT request to update conversion definitions.
	 *
	 * @param  Request    $request
	 * @throws BadRequest
	 * @return Response
	 */
	public function process(Request $request): Response {
		$data = $request->getParsedBody();

		if (
			empty($data->scope) ||
			empty($data->foreignScope) ||
			!isset($data->data)
		) {
			throw new BadRequest('Missing required fields: scope, foreignScope, and data are required.');
		}

		$scope = $data->scope;
		$foreignScope = $data->foreignScope;
		$dataToSave = $data->data;
		$isCustom = false;
		$conversionDefs = $this->metadata->get(['conversionDefs', $scope]);

		if (!$conversionDefs) {
			$conversionDefs = $this->metadata->getCustom('conversionDefs', $scope, (object)[]);
			$isCustom = true;
		}

		$conversionDefs->$foreignScope = $dataToSave;

		if ($isCustom) {
			// Save the data using saveCustom method
			$this->metadata->saveCustom('conversionDefs', $scope, $conversionDefs);
		} else {
			$this->metadata->save();
		}

		return ResponseComposer::json(true);
	}

}
