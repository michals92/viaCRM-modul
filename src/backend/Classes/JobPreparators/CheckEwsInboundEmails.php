<?php

namespace Espo\Modules\Viacrm\Classes\JobPreparators;

use DateTimeImmutable;
use Espo\Core\Job\Preparator;
use Espo\Core\Job\Preparator\CollectionHelper;
use Espo\Core\Job\Preparator\Data;
use Espo\Entities\InboundEmail;
use Espo\ORM\EntityManager;

/**
 * Prepares jobs for checking EWS group email accounts (InboundEmail).
 */
class CheckEwsInboundEmails implements Preparator
{
	/**
	 * @param CollectionHelper<InboundEmail> $helper
	 */
	public function __construct(
		private EntityManager $entityManager,
		private CollectionHelper $helper
	) {
	}

	public function prepare(Data $data, DateTimeImmutable $executeTime): void
	{
		$collection = $this->entityManager
			->getRDBRepositoryByClass(InboundEmail::class)
			->where([
				'status' => InboundEmail::STATUS_ACTIVE,
				'useEws' => true,
			])
			->find();

		$this->helper->prepare($collection, $data, $executeTime);
	}
}
