<?php

namespace Espo\Modules\Viacrm\Api\Product;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Modules\Viacrm\Services\Product as ProductService;

class GetSelectAttributes implements Action {
	public function __construct(
		private readonly ProductService $productService
	) {}

	/**
	 * @throws BadRequest
	 */
	public function process(Request $request): Response {
		$productId = $request->getRouteParam('productId');

		if (!$productId) {
			throw new BadRequest('Missing product ID');
		}

		$existingAccountId = $request->getQueryParam('existingAccountId');

		$attributes = $this->productService->getSelectAttributes($productId, $existingAccountId);

		return ResponseComposer::json([
		    'attributes' => $attributes,
		]);
	}
}
