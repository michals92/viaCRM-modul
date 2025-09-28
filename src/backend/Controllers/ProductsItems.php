<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Controllers\Record;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;

class ProductsItems extends Record
{
    /**
     * POST api/v1/ProductsItems/action/recalculateQuantities
     * Recalculate quantities for all products
     */
    public function postActionRecalculateQuantities(Request $request, Response $response): array
    {
        if (!$this->user->isAdmin()) {
            throw new Forbidden();
        }

        $service = $this->recordServiceContainer->get('ProductsItems');
        $service->recalculateAllQuantities();

        return [
            'success' => true,
            'message' => 'Quantities recalculated successfully'
        ];
    }

    /**
     * POST api/v1/ProductsItems/action/recalculateForProduct
     * Recalculate quantities for a specific product
     */
    public function postActionRecalculateForProduct(Request $request, Response $response): array
    {
        $data = $request->getParsedBody();
        
        if (empty($data->productId)) {
            throw new BadRequest('Product ID is required');
        }

        $service = $this->recordServiceContainer->get('ProductsItems');
        $service->updateCalculatedFields($data->productId);

        $product = $this->entityManager->getEntity('ProductsItems', $data->productId);
        
        if (!$product) {
            throw new BadRequest('Product not found');
        }

        return [
            'success' => true,
            'orderQuantity' => $product->get('orderQuantity'),
            'quoteQuantity' => $product->get('quoteQuantity'),
            'availableStockQuantity' => $product->get('availableStockQuantity'),
            'message' => 'Quantities recalculated successfully'
        ];
    }

    /**
     * POST api/v1/ProductsItems/action/getLiveQuantities
     * Get current live quantities without saving
     */
    public function postActionGetLiveQuantities(Request $request, Response $response): array
    {
        $data = $request->getParsedBody();
        
        if (empty($data->productId)) {
            throw new BadRequest('Product ID is required');
        }

        $service = $this->recordServiceContainer->get('ProductsItems');
        $product = $this->entityManager->getEntity('ProductsItems', $data->productId);
        
        if (!$product) {
            throw new BadRequest('Product not found');
        }

        // If temporary stockQuantity is provided (for real-time calculation), use it
        if (isset($data->tempStockQuantity)) {
            $product->set('stockQuantity', (int) $data->tempStockQuantity);
        }

        // Calculate live quantities without saving
        $orderQuantity = $service->calculateOrderQuantity($product);
        $quoteQuantity = $service->calculateQuoteQuantity($product);
        $availableStockQuantity = $service->calculateAvailableStockQuantity($product);

        return [
            'orderQuantity' => $orderQuantity,
            'quoteQuantity' => $quoteQuantity,
            'availableStockQuantity' => $availableStockQuantity
        ];
    }
}
