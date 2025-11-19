<?php

namespace Espo\Modules\Autocrm\Tools\ManualWorkflow;

use Espo\Core\ORM\EntityManager;
use Espo\Entities\User;
use stdClass;

class Service {

	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly User $user
	) {}

	//TODO: This whole function can probably be optimized using the query builder
	public function get(): stdClass {
		// Ensure the Workflow class exists, if it doesn't, the Advanced module is not installed
		if (!class_exists('\Espo\Modules\Advanced\Entities\Workflow')) {
			return new stdClass();
		}

		$data = (object) [];

		$builder = $this->entityManager
		    ->getRDBRepository('Workflow')
		    ->where([
		        'type' => \Espo\Modules\Advanced\Entities\Workflow::TYPE_MANUAL,
		        'isActive' => true,
		    ])
		    ->order('manualLabel', 'ASC');

		if (!$this->user->isAdmin()) {
			$builder
			    ->distinct()
			    ->join('manualTeams')
			    ->where(['manualTeams.id' => $this->user->getTeamIdList()]);

			$builder->where(['manualAccessRequired!=' => 'admin']);
		}

		/** @var iterable<\Espo\Modules\Advanced\Entities\Workflow> $workflows */
		$workflows = $builder->find();

		foreach ($workflows as $workflow) {
			$entityType = $workflow->getTargetEntityType();

			if (!property_exists($data, $entityType)) {
				$data->$entityType = [];
			}

			$item = (object) [
			    'id' => $workflow->getId(),
			    'label' => $workflow->get('manualLabel'),
			    'accessRequired' => $workflow->get('manualAccessRequired'),
			    'elementType' => $workflow->get('manualElementType'),
			    'dynamicLogic' => $workflow->get('manualDynamicLogic'),
			    'confirmation' => $workflow->get('manualConfirmation'),
			    'confirmationText' => $workflow->get('manualConfirmationText'),
			    'style' => $workflow->get('manualStyle'),
			];

			$data->$entityType[] = $item;
		}

		return $data;
	}

	public function checkAccess(string $workflowId): bool {
		if ($this->user->isAdmin()) {
			return true;
		}

		$builder = $this->entityManager
		    ->getRDBRepository('Workflow')
		    ->where([
		        'type' => \Espo\Modules\Advanced\Entities\Workflow::TYPE_MANUAL,
		    ])
		    ->join('manualTeams')
		    ->where(['manualTeams.id' => $this->user->getTeamIdList()])
		    ->where(['id' => $workflowId]);

		return (bool) $builder->findOne();
	}

}