<?php

namespace Espo\Modules\ViaCrm\Hooks\Hr;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

class CalculateVacation implements BeforeSave
{
	public static int $order = 10;

	public function beforeSave(Entity $entity, SaveOptions $options): void
	{
		$this->calculateRemainingVacationHours($entity);
	}

	private function calculateRemainingVacationHours(Entity $entity): void
	{
		$total = $entity->get('vacationHoursTotal') ?? 0;
		$used = $entity->get('vacationHoursUsed') ?? 0;

		$remaining = max(0, $total - $used);

		$entity->set('vacationHoursRemaining', $remaining);
	}
}
