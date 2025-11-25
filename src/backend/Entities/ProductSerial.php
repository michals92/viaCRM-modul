<?php

namespace Espo\Modules\Viacrm\Entities;

use Espo\Modules\Crm\Entities\Account;

class ProductSerial extends \Espo\Core\Templates\Entities\CategoryTree
{
    public const string TEMPLATE_TYPE = 'Base';

    public const string ENTITY_TYPE = 'ProductSerial';

    protected $entityType = 'ProductSerial';

    /**
     * Get serial number.
     */
    public function getSerialNumber(): string
    {
        return $this->get('serialNumber');
    }

    /**
     * Get linked product.
     */
    public function getProduct(): Product
    {
        return $this->get('product');
    }

    /**
     * Get current status.
     */
    public function getStatus(): string
    {
        return $this->get('status');
    }

    /**
     * Check if serial is active.
     */
    public function isActive(): bool
    {
        return $this->get('status') === 'Active';
    }

    /**
     * Check if still under warranty.
     */
    public function isUnderWarranty(): bool
    {
        $warrantyUntil = $this->get('warrantyUntil');
        if (!$warrantyUntil) {
            return false;
        }

        $warrantyDate = new \DateTime($warrantyUntil);
        $today = new \DateTime();

        return $warrantyDate > $today;
    }

    /**
     * Get manufactured date.
     */
    public function getManufacturedDate(): ?string
    {
        return $this->get('manufacturedDate');
    }

    /**
     * Get batch number.
     */
    public function getBatchNumber(): ?string
    {
        return $this->get('batchNumber');
    }

    /**
     * Get current owner account.
     */
    public function getCurrentOwner(): ?Account
    {
        return $this->get('currentOwner');
    }

    /**
     * Add note to serial history.
     */
    public function addNote(string $note): void
    {
        $currentNotes = $this->get('notes');
        $timestamp = date('Y-m-d H:i:s');
        $newNote = "[$timestamp] $note";

        if ($currentNotes) {
            $this->set('notes', $currentNotes . "\n" . $newNote);
        } else {
            $this->set('notes', $newNote);
        }
    }

    /**
     * Change status with automatic note.
     */
    public function changeStatus(string $newStatus, ?string $reason = null): void
    {
        $oldStatus = $this->get('status');
        $this->set('status', $newStatus);

        $note = "Status changed from '$oldStatus' to '$newStatus'";
        if ($reason) {
            $note .= " - Reason: $reason";
        }

        $this->addNote($note);
    }
}
