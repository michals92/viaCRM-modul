<?php

namespace Espo\Modules\Autocrm\Classes\MassAction\BpmnProcess;

use Espo\Core\MassAction\Data as MassActionData;
use Espo\Core\MassAction\MassAction;
use Espo\Core\MassAction\Params as MassActionParams;
use Espo\Core\MassAction\QueryBuilder as MassActionQueryBuilder;
use Espo\Core\MassAction\Result;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Record\ServiceFactory;
use Espo\Modules\Advanced\Services\BpmnProcess as BpmnService;
use Exception;

// TODO: this could be optimized to only query ids
class Stop implements MassAction {

	public function __construct(
		private readonly MassActionQueryBuilder $massActionQueryBuilder,
		private readonly EntityManager $entityManager,
		private readonly ServiceFactory $serviceFactory,
	) {}

	public function process(MassActionParams $params, MassActionData $data): Result {
		$repository = $this->entityManager->getRDBRepository('BpmnProcess');
		/** @var BpmnService $service */
		$service = $this->serviceFactory->create('BpmnProcess');

		$query = $this->massActionQueryBuilder->build($params);

		$collection = $repository
		    ->clone($query)
		    ->sth()
		    ->find();

		$ids = [];

		$count = 0;

		foreach ($collection as $process) {
			try {
				$service->stopProcess($process->getId());
                    
				$ids[] = $process->getId();
				$count++;
			} catch (Exception) {
				continue;
			}
		}

		return new Result($count, $ids);
	}

}