<?php

namespace Espo\Modules\ViaCrm\Services;

use Espo\Core\Templates\Services\Base;
use Espo\Core\Exceptions\BadRequest;

class Hr extends Base
{
    public function createFromUser(string $userId): \stdClass
    {
        $user = $this->getEntityManager()->getEntity('User', $userId);
        
        if (!$user) {
            throw new BadRequest('User not found');
        }

        // Zkontroluj zda už HR záznam existuje
        $existingHr = $this->getEntityManager()
            ->getRepository('Hr')
            ->where([
                'email' => $user->get('emailAddress'),
                'deleted' => false
            ])
            ->findOne();

        if ($existingHr) {
            throw new BadRequest('HR record already exists for this user');
        }

        // Vytvoř nový HR záznam
        $hrData = [
            'name' => $user->get('name') ?: trim(($user->get('firstName') ?? '') . ' ' . ($user->get('lastName') ?? '')),
            'firstName' => $user->get('firstName'),
            'lastName' => $user->get('lastName'),
            'email' => $user->get('emailAddress'),
            'phone' => $user->get('phoneNumber'),
            'status' => 'Active',
            'assignedUserId' => $userId
        ];

        $hrEntity = $this->getRepository()->create((object) $hrData);
        
        return $hrEntity;
    }
}