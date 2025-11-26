<?php

namespace Espo\Modules\Viacrm\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Conflict;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\InternalServerError;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Exceptions\ServiceUnavailable;
use Espo\Core\Exceptions\Unauthorized;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Metadata;
use Espo\Modules\Viacrm\Classes\EmailPdf\AttributeProvider;
use Espo\Modules\Viacrm\Classes\EmailPdf\DefaultAttributeProvider;
use stdClass;

class EmailPdfAttributes implements Action
{
	public function __construct(
		private readonly Metadata $metadata,
		private readonly InjectableFactory $injectableFactory,
		private readonly DefaultAttributeProvider $defaultAttributeProvider
	) {
	}

	/**
	 * Processes the request to fetch email PDF attributes.
	 *
	 * @param Request $request
	 *
	 * @throws BadRequest
	 * @throws Forbidden
	 * @throws NotFound
	 * @throws Conflict
	 * @throws ServiceUnavailable
	 * @throws InternalServerError
	 * @throws Unauthorized
	 *
	 * @return Response
	 */
	public function process(Request $request): Response
	{
		// Initialize an empty response object
		$response = new stdClass();

		// Retrieve query parameters
		$entityType = $request->getQueryParam('entityType');
		$id = $request->getQueryParam('id');
		$templateId = $request->getQueryParam('templateId');

		// Validate required parameters
		if (!$entityType || !$id || !$templateId) {
			throw new BadRequest('Missing required query parameters: entityType, id, and templateId are required.');
		}

		// Fetch pdfDefs from metadata
		/** @var class-string<AttributeProvider>|null */
		$providerClassName = $this->metadata->get(['pdfDefs', $entityType, 'emailPdfAttributeProviderClassName']);

		if ($providerClassName) {
			// Attempt to instantiate the custom attribute provider
			/** @var AttributeProvider $attributeProvider */
			$attributeProvider = $this->injectableFactory->create($providerClassName);

			// Ensure the provider implements the AttributeProvider interface
			if (!$attributeProvider instanceof AttributeProvider) {
				throw new BadRequest("The class '{$providerClassName}' must implement the AttributeProvider interface.");
			}

			// Fetch attributes using the custom provider
			$attributes = $attributeProvider->getAttributes($entityType, $id, $templateId);
		} else {
			// Use the DefaultAttributeProvider if no custom provider is specified
			$attributes = $this->defaultAttributeProvider->getAttributes($entityType, $id, $templateId);
		}

		// Assign the fetched attributes to the response
		$response = $attributes;

		// Return the response as JSON
		return ResponseComposer::json($response);
	}
}
