<?php

namespace Espo\Modules\ViaCrm\Controllers;

use Espo\Core\Controllers\Record;
use Espo\Core\Api\Request;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Entities\Attachment;
use Espo\Core\FileStorage\Manager as FileStorageManager;
use Espo\Tools\Pdf\Service as PdfService;

class Order extends Record
{
    public function postActionGeneratePdfWithAttachment(Request $request): array
    {
        $data = $request->getParsedBody();
        
        $entityId = $data->entityId ?? null;
        $templateId = $data->templateId ?? null;
        
        if (!$entityId || !$templateId) {
            throw new BadRequest('Missing required parameters');
        }
        
        // Check permissions
        $entity = $this->entityManager->getEntityById('Order', $entityId);
        if (!$entity) {
            throw new NotFound('Order not found');
        }
        
        if (!$this->acl->check($entity, 'read')) {
            throw new Forbidden();
        }
        
        // Get template
        $template = $this->entityManager->getEntityById('Template', $templateId);
        if (!$template) {
            throw new NotFound('Template not found');
        }
        
        if (!$this->acl->check($template, 'read')) {
            throw new Forbidden('No access to template');
        }
        
        try {
            // Use EspoCRM's built-in PDF service
            $pdfService = $this->injectableFactory->create(PdfService::class);
            $pdfData = $pdfService->generate('Order', $entityId, $templateId);
            $pdfContents = $pdfData->getString();
            
            if (!$pdfContents) {
                throw new BadRequest('Generated PDF is empty');
            }
            
            // Create unique filename
            $entityName = $entity->get('name') ?: $entityId;
            $fileName = preg_replace('/[^a-zA-Z0-9_\-.]/', '_', $entityName) . '_' . date('Y-m-d_H-i-s') . '.pdf';
            
            // Create attachment entity
            $attachment = $this->entityManager
                ->getRDBRepositoryByClass(Attachment::class)
                ->getNew();
                
            $attachment->set([
                'name' => $fileName,
                'type' => 'application/pdf',
                'size' => strlen($pdfContents),
                'role' => 'Attachment',
                'relatedType' => 'Email',
                'field' => 'attachments'
            ]);
            
            // Save attachment to database
            $this->entityManager->saveEntity($attachment);
            
            // Save PDF contents to file storage
            $fileStorageManager = $this->injectableFactory->create(FileStorageManager::class);
            $fileStorageManager->putContents($attachment, $pdfContents);
            
            return [
                'id' => $attachment->getId(),
                'name' => $attachment->get('name'),
                'size' => $attachment->get('size')
            ];
            
        } catch (\Exception $e) {
            $this->log->error('Failed to generate PDF for Order', [
                'entityId' => $entityId,
                'templateId' => $templateId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new BadRequest('Failed to generate PDF: ' . $e->getMessage());
        }
    }

    public function postActionConvertToInvoice(Request $request): array
    {
        $data = $request->getParsedBody();
        $orderId = $data->id ?? null;
        
        if (!$orderId) {
            throw new BadRequest('Missing order ID');
        }
        
        // Check permissions
        $order = $this->entityManager->getEntityById('Order', $orderId);
        if (!$order) {
            throw new NotFound('Order not found');
        }
        
        if (!$this->acl->check($order, 'read')) {
            throw new Forbidden('No read access to Order');
        }
        
        if (!$this->acl->check('Invoice', 'create')) {
            throw new Forbidden('No create access to Invoice');
        }
        
        try {
            // Create new Invoice entity
            $invoice = $this->entityManager->getEntity('Invoice');
            
            // Set basic fields
            $invoice->set([
                'name' => 'Invoice from: ' . $order->get('name'),
                'status' => 'draft',
                'issueDate' => date('Y-m-d'),
                'taxableSupplyDate' => date('Y-m-d'),
                'dueDate' => date('Y-m-d', strtotime('+14 days')), // Default 14 days payment term
                'description' => $order->get('description'),
                'invoiceType' => 'standard'
            ]);
            
            // Debug: Log all Order data
            $GLOBALS['log']->info('Converting Order to Invoice - Order data:', [
                'id' => $order->getId(),
                'name' => $order->get('name'),
                'accountId' => $order->get('accountId'),
                'contactId' => $order->get('contactId'),
                'assignedUserId' => $order->get('assignedUserId')
            ]);
            
            // Copy account if exists and populate account-related fields
            $accountId = $order->get('accountId');
            if ($accountId) {
                $invoice->set('accountId', $accountId);
                
                // Load account entity to copy additional fields
                $account = $this->entityManager->getEntityById('Account', $accountId);
                if ($account) {
                    // Copy account organizational data - use same logic as invoice-dynamic-handler.js
                    
                    // Company ID (IČO)
                    if ($account->get('companyId')) {
                        $invoice->set('accountCompanyId', $account->get('companyId'));
                    } elseif ($account->get('ico')) {
                        $invoice->set('accountCompanyId', $account->get('ico'));
                    }
                    
                    // Tax ID (DIČ)
                    if ($account->get('taxId')) {
                        $invoice->set('accountTaxId', $account->get('taxId'));
                    } elseif ($account->get('dic')) {
                        $invoice->set('accountTaxId', $account->get('dic'));
                    }
                    
                    // VAT ID
                    if ($account->get('vatId')) {
                        $invoice->set('accountVatId', $account->get('vatId'));
                    } elseif ($account->get('vatNumber')) {
                        $invoice->set('accountVatId', $account->get('vatNumber'));
                    }
                    
                    // Copy billing address from account
                    $invoice->set('billingAddressStreet', $account->get('billingAddressStreet'));
                    $invoice->set('billingAddressCity', $account->get('billingAddressCity'));
                    $invoice->set('billingAddressState', $account->get('billingAddressState'));
                    $invoice->set('billingAddressCountry', $account->get('billingAddressCountry'));
                    $invoice->set('billingAddressPostalCode', $account->get('billingAddressPostalCode'));
                    
                    // Copy shipping address from account (use billing as default if shipping doesn't exist)
                    $invoice->set('shippingAddressStreet', $account->get('shippingAddressStreet') ?: $account->get('billingAddressStreet'));
                    $invoice->set('shippingAddressCity', $account->get('shippingAddressCity') ?: $account->get('billingAddressCity'));
                    $invoice->set('shippingAddressState', $account->get('shippingAddressState') ?: $account->get('billingAddressState'));
                    $invoice->set('shippingAddressCountry', $account->get('shippingAddressCountry') ?: $account->get('billingAddressCountry'));
                    $invoice->set('shippingAddressPostalCode', $account->get('shippingAddressPostalCode') ?: $account->get('billingAddressPostalCode'));
                    
                    $GLOBALS['log']->info('Converting Order to Invoice: copied account data:', [
                        'companyId' => $invoice->get('accountCompanyId'),
                        'taxId' => $invoice->get('accountTaxId'),
                        'vatId' => $invoice->get('accountVatId'),
                        'billingCity' => $invoice->get('billingAddressCity')
                    ]);
                }
                
                $GLOBALS['log']->info('Converting Order to Invoice: copying accountId: ' . $accountId);
            } else {
                $GLOBALS['log']->info('Converting Order to Invoice: no accountId found');
            }
            
            // Copy contact person if exists
            $contactId = $order->get('contactId');
            if ($contactId) {
                $invoice->set('contactPersonId', $contactId);
                $GLOBALS['log']->info('Converting Order to Invoice: copying contactId: ' . $contactId);
            } else {
                $GLOBALS['log']->info('Converting Order to Invoice: no contactId found');
            }
            
            // Copy assigned user if exists
            if ($order->get('assignedUserId')) {
                $invoice->set('assignedUserId', $order->get('assignedUserId'));
            }
            
            // Convert order items to invoice items
            $orderItems = $order->get('orderItems');
            if ($orderItems) {
                $invoice->set('invoiceItems', $orderItems);
            }
            
            // Copy discount fields if they exist
            if ($order->has('overallDiscountType')) {
                $invoice->set('overallDiscountType', $order->get('overallDiscountType'));
            }
            if ($order->has('overallDiscountValue')) {
                $invoice->set('overallDiscountValue', $order->get('overallDiscountValue'));
            }
            
            // Save the invoice
            $this->entityManager->saveEntity($invoice);
            
            // Debug: Log saved Invoice data
            $GLOBALS['log']->info('Converting Order to Invoice - Saved Invoice data:', [
                'id' => $invoice->getId(),
                'name' => $invoice->get('name'),
                'accountId' => $invoice->get('accountId'),
                'contactPersonId' => $invoice->get('contactPersonId'),
                'assignedUserId' => $invoice->get('assignedUserId')
            ]);
            
            // Update order status
            $order->set('status', 'Invoiced');
            $this->entityManager->saveEntity($order);
            
            return [
                'success' => true,
                'invoiceId' => $invoice->getId(),
                'invoiceName' => $invoice->get('name'),
                'message' => 'Order successfully converted to invoice'
            ];
            
        } catch (\Exception $e) {
            $this->log->error('Failed to convert order to invoice', [
                'orderId' => $orderId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw new BadRequest('Failed to convert order to invoice: ' . $e->getMessage());
        }
    }
}
