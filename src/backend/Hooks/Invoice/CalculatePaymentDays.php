<?php

namespace Espo\Modules\ViaCrm\Hooks\Invoice;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

class CalculatePaymentDays implements BeforeSave
{
    public function beforeSave(Entity $entity, SaveOptions $options): void
    {
        $this->calculatePaymentDays($entity);
    }

    private function calculatePaymentDays(Entity $entity): void
    {
        $issueDate = $entity->get('issueDate');
        $dueDate = $entity->get('dueDate');

        if (!$issueDate || !$dueDate) {
            $entity->set('paymentDays', null);
            return;
        }

        try {
            $issueDateObj = new \DateTime($issueDate);
            $dueDateObj = new \DateTime($dueDate);
            
            $interval = $issueDateObj->diff($dueDateObj);
            $daysDiff = $interval->days;
            
            // If due date is before issue date, make it negative
            if ($dueDateObj < $issueDateObj) {
                $daysDiff = -$daysDiff;
            }

            $entity->set('paymentDays', $daysDiff);
            
        } catch (\Exception $e) {
            $entity->set('paymentDays', null);
        }
    }
}