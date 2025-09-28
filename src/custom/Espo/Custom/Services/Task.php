<?php

namespace Espo\Custom\Services;

use Espo\Services\Record;
use Espo\ORM\Entity;

class Task extends Record
{
    public function loadAdditionalFields(Entity $entity): void
    {
        parent::loadAdditionalFields($entity);
        
        // Vždy načteme timeSpent pro detail view
        $this->loadTimeSpent($entity);
    }
    
    protected function loadTimeSpent(Entity $entity): void
    {
        if (!$entity->getId()) {
            $entity->set('timeSpent', 0.0);
            return;
        }
        
        // Použijeme přímý SQL dotaz
        $sql = "SELECT SUM(time_spent) as total_time FROM time_entry WHERE task_id = :taskId AND deleted = 0";
        
        $pdo = $this->entityManager->getPDO();
        $sth = $pdo->prepare($sql);
        $sth->bindValue(':taskId', $entity->getId());
        $sth->execute();
        
        $row = $sth->fetch(\PDO::FETCH_ASSOC);
        
        $totalTime = ($row && $row['total_time'] !== null) ? (float) $row['total_time'] : 0.0;
        $entity->set('timeSpent', $totalTime);
    }
    
    public function loadAdditionalFieldsForList(Entity $entity): void
    {
        parent::loadAdditionalFieldsForList($entity);
        
        // Pro seznam také načteme timeSpent
        $this->loadTimeSpent($entity);
    }
}