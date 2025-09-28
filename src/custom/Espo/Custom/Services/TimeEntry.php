<?php

namespace Espo\Custom\Services;

use Espo\Services\Record;
use Espo\ORM\Entity;

class TimeEntry extends Record
{
    public function beforeCreateEntity(Entity $entity, $data)
    {
        parent::beforeCreateEntity($entity, $data);
        
        // Automaticky vygenerovat název
        if (!$entity->get('name')) {
            $hours = $entity->get('timeSpent') ?: 0;
            $date = $entity->get('dateLogged') ?: date('Y-m-d');
            $entity->set('name', "Time Entry - {$hours}h - {$date}");
        }
    }
    
    public function beforeUpdateEntity(Entity $entity, $data)
    {
        parent::beforeUpdateEntity($entity, $data);
        
        // Aktualizovat název pokud se změnil čas
        if ($entity->isAttributeChanged('timeSpent') || !$entity->get('name')) {
            $hours = $entity->get('timeSpent') ?: 0;
            $date = $entity->get('dateLogged') ?: date('Y-m-d');
            $entity->set('name', "Time Entry - {$hours}h - {$date}");
        }
    }
}