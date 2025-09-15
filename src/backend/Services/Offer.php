<?php

namespace Espo\Modules\ViaCrm\Services;

use Espo\Services\Record;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;

class Offer extends Record
{
    public function convertToOrder($id)
    {
        // Get the offer entity
        $offer = $this->entityManager->getEntity('Offer', $id);
        
        if (!$offer) {
            throw new NotFound('Offer not found');
        }
        
        // Check permissions
        if (!$this->acl->check($offer, 'read')) {
            throw new Forbidden('No read access to Offer');
        }
        
        if (!$this->acl->check('Order', 'create')) {
            throw new Forbidden('No create access to Order');
        }
        
        // Create new Order entity
        $order = $this->entityManager->getEntity('Order');
        
        // Set basic fields
        $order->set([
            'name' => 'Order from: ' . $offer->get('name'),
            'status' => 'Draft',
            'orderDate' => date('Y-m-d'),
            'description' => $offer->get('description'),
            'offerId' => $offer->getId()
        ]);
        
        // Copy account if exists
        if ($offer->get('accountId')) {
            $order->set('accountId', $offer->get('accountId'));
        }
        
        // Copy contact if exists
        if ($offer->get('contactId')) {
            $order->set('contactId', $offer->get('contactId'));
        }
        
        // Copy assigned user if exists
        if ($offer->get('assignedUserId')) {
            $order->set('assignedUserId', $offer->get('assignedUserId'));
        }
        
        // Convert and set order items
        $offerItems = $offer->get('offerItems');
        if ($offerItems) {
            $orderItems = $this->convertOfferItemsToOrderItems($offerItems);
            $order->set('orderItems', $orderItems);
        }
        
        // Copy discount fields if they exist
        if ($offer->has('overallDiscountType')) {
            $order->set('overallDiscountType', $offer->get('overallDiscountType'));
        }
        if ($offer->has('overallDiscountValue')) {
            $order->set('overallDiscountValue', $offer->get('overallDiscountValue'));
        }
        
        // Save the order
        $this->entityManager->saveEntity($order);
        
        // Update offer status
        $offer->set('status', 'Accepted');
        $this->entityManager->saveEntity($offer);
        
        return $order;
    }
    
    protected function convertOfferItemsToOrderItems($offerItems)
    {
        if (empty($offerItems)) {
            return [];
        }
        
        // Convert stdClass to array if needed
        if (is_object($offerItems)) {
            $offerItems = json_decode(json_encode($offerItems), true);
        }
        
        if (!is_array($offerItems)) {
            return [];
        }
        
        $orderItems = [];
        
        foreach ($offerItems as $item) {
            // Convert item to array if it's an object
            if (is_object($item)) {
                $item = json_decode(json_encode($item), true);
            }
            
            $orderItems[] = [
                'productId' => $item['productId'] ?? null,
                'productName' => $item['productName'] ?? '',
                'quantity' => $item['quantity'] ?? 1,
                'unitPrice' => $item['unitPrice'] ?? 0,
                'vat' => $item['vat'] ?? 0,
                'discountType' => $item['discountType'] ?? 'percentage',
                'discountValue' => $item['discountValue'] ?? 0,
                'isCustom' => $item['isCustom'] ?? false
            ];
        }
        
        return $orderItems;
    }
}
