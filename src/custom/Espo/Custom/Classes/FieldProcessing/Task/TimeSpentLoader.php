<?php

namespace Espo\Custom\Classes\FieldProcessing\Task;

use Espo\Core\FieldProcessing\Loader;
use Espo\Core\FieldProcessing\Loader\Params;
use Espo\ORM\Entity;
use Espo\Core\ORM\EntityManager;

class TimeSpentLoader implements Loader
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function process(Entity $entity, Params $params): void
    {
        if (!$entity->getId()) {
            $entity->set('timeSpent', 0.0);
            return;
        }
        
        // Použijeme přímý SQL dotaz pro spolehlivý výpočet
        $sql = "SELECT SUM(time_spent) as total_time FROM time_entry WHERE task_id = :taskId AND deleted = 0";
        
        $pdo = $this->entityManager->getPDO();
        $sth = $pdo->prepare($sql);
        $sth->bindValue(':taskId', $entity->getId());
        $sth->execute();
        
        $row = $sth->fetch(\PDO::FETCH_ASSOC);
        
        $totalTime = ($row && $row['total_time'] !== null) ? (float) $row['total_time'] : 0.0;
        $entity->set('timeSpent', $totalTime);
    }
}