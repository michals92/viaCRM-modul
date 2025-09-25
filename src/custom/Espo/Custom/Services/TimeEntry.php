<?php

namespace Espo\Custom\Services;

use Espo\ORM\Entity;

class TimeEntry extends \Espo\Services\Record
{
    protected function beforeCreateEntity(Entity $entity, $data)
    {
        parent::beforeCreateEntity($entity, $data);
        
        // Nastav aktuálního uživatele pokud není nastaven
        if (!$entity->get('userId')) {
            $entity->set('userId', $this->getUser()->getId());
        }
        
        // Nastav aktuální čas pokud není nastaven
        if (!$entity->get('dateLogged')) {
            $entity->set('dateLogged', date('Y-m-d H:i:s'));
        }
        
        // Nastav název pokud není nastaven
        if (!$entity->get('name')) {
            $timeSpent = $entity->get('timeSpent') ?: 0;
            $description = $entity->get('description') ? ' - ' . substr($entity->get('description'), 0, 30) : '';
            $entity->set('name', "Time Entry {$timeSpent}h{$description}");
        }
    }
}