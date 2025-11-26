<?php

namespace Espo\Modules\ViaCrm\Services;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Templates\Services\Base;

class Absence extends Base {
	protected function beforeCreate(\stdClass $data, array $params): void {
		parent::beforeCreate($data, $params);
        
		// Automatically set requestedBy to current user if not set
		if (!isset($data->requestedById)) {
			$data->requestedById = $this->getUser()->getId();
		}
        
		// Calculate working days
		if (isset($data->startDate) && isset($data->endDate)) {
			$data->days = $this->calculateWorkingDays($data->startDate, $data->endDate);
		}
        
		// Generate name if not provided
		if (!isset($data->name) || empty($data->name)) {
			$type = $data->type ?? 'vacation';
			$startDate = $data->startDate ?? date('Y-m-d');
			$data->name = ucfirst(str_replace('_', ' ', $type)) . ' - ' . $startDate;
		}
	}

	protected function beforeUpdate(\stdClass $data, array $params): void {
		parent::beforeUpdate($data, $params);
        
		// Recalculate days if dates changed
		if (isset($data->startDate) && isset($data->endDate)) {
			$data->days = $this->calculateWorkingDays($data->startDate, $data->endDate);
		}
	}

	public function approve(string $id, ?string $comment = null): \stdClass {
		$entity = $this->getEntity($id);
        
		if (!$entity) {
			throw new NotFound();
		}
        
		if ($entity->get('status') !== 'pending') {
			throw new BadRequest('Only pending requests can be approved');
		}
        
		$this->checkApprovalPermissions($entity);
        
		$data = (object) [
		    'status' => 'approved',
		    'approvedById' => $this->getUser()->getId(),
		    'approvedAt' => date('Y-m-d H:i:s'),
		    'approverComment' => $comment
		];
        
		$this->updateEntity($id, $data);
        
		return $this->getEntity($id);
	}

	public function reject(string $id, string $comment): \stdClass {
		$entity = $this->getEntity($id);
        
		if (!$entity) {
			throw new NotFound();
		}
        
		if ($entity->get('status') !== 'pending') {
			throw new BadRequest('Only pending requests can be rejected');
		}
        
		$this->checkApprovalPermissions($entity);
        
		$data = (object) [
		    'status' => 'rejected',
		    'approvedById' => $this->getUser()->getId(),
		    'approvedAt' => date('Y-m-d H:i:s'),
		    'approverComment' => $comment
		];
        
		$this->updateEntity($id, $data);
        
		return $this->getEntity($id);
	}

	public function cancel(string $id): \stdClass {
		$entity = $this->getEntity($id);
        
		if (!$entity) {
			throw new NotFound();
		}
        
		// Only requester or admin can cancel
		if ($entity->get('requestedById') !== $this->getUser()->getId() && !$this->getUser()->isAdmin()) {
			throw new Forbidden('You can only cancel your own requests');
		}
        
		if (!in_array($entity->get('status'), ['pending', 'approved'])) {
			throw new BadRequest('Only pending or approved requests can be cancelled');
		}
        
		$data = (object) [
		    'status' => 'cancelled'
		];
        
		$this->updateEntity($id, $data);
        
		return $this->getEntity($id);
	}

	public function getMyRequests(array $searchParams = []): \stdClass {
		$searchParams['where'][] = [
		    'type' => 'equals',
		    'attribute' => 'requestedById',
		    'value' => $this->getUser()->getId()
		];
        
		return $this->find($searchParams);
	}

	public function getPendingApprovals(array $searchParams = []): \stdClass {
		// For now, show all pending requests to users with edit access
		// In production, you might want to implement team-based approval
		$searchParams['where'][] = [
		    'type' => 'equals',
		    'attribute' => 'status',
		    'value' => 'pending'
		];
        
		return $this->find($searchParams);
	}

	public function calculateWorkingDays(string $startDate, string $endDate): int {
		$start = new \DateTime($startDate);
		$end = new \DateTime($endDate);
        
		if ($start > $end) {
			throw new BadRequest('End date must be after start date');
		}
        
		$days = 0;
		$current = clone $start;
        
		while ($current <= $end) {
			// Skip weekends (Saturday = 6, Sunday = 0)
			$dayOfWeek = (int) $current->format('w');
			if ($dayOfWeek !== 0 && $dayOfWeek !== 6) {
				$days++;
			}
			$current->add(new \DateInterval('P1D'));
		}
        
		return $days;
	}

	private function validateDates(\stdClass $data, ?string $id = null): void {
		if (!isset($data->startDate) || !isset($data->endDate)) {
			return; // Skip validation if dates not provided
		}
        
		$startDate = new \DateTime($data->startDate);
		$endDate = new \DateTime($data->endDate);
        
		if ($startDate > $endDate) {
			throw new BadRequest('End date must be after start date');
		}
        
		// Don't allow requests for past dates (except for sick leave)
		$today = new \DateTime('today');
		$type = $data->type ?? 'vacation';
        
		if ($type !== 'sick_leave' && $startDate < $today) {
			throw new BadRequest('Cannot request leave for past dates (except sick leave)');
		}
	}

	private function checkOverlappingRequests(\stdClass $data, ?string $excludeId = null): void {
		$requestedById = $data->requestedById ?? $this->getUser()->getId();
        
		$whereClause = [
		    'requestedById' => $requestedById,
		    'status!=' => ['rejected', 'cancelled'],
		    'OR' => [
		        [
		            'startDate<=' => $data->startDate,
		            'endDate>=' => $data->startDate
		        ],
		        [
		            'startDate<=' => $data->endDate,
		            'endDate>=' => $data->endDate
		        ],
		        [
		            'startDate>=' => $data->startDate,
		            'endDate<=' => $data->endDate
		        ]
		    ]
		];
        
		if ($excludeId) {
			$whereClause['id!='] = $excludeId;
		}
        
		$overlapping = $this->getRepository()->where($whereClause)->findOne();
        
		if ($overlapping) {
			throw new BadRequest('You already have an absence request for overlapping dates');
		}
	}

	private function checkApprovalPermissions(\stdClass $entity): void {
		// Basic permission check - user must have edit access
		if (!$this->getAcl()->check($entity, 'edit')) {
			throw new Forbidden('No permission to approve/reject this request');
		}
        
		// Don't allow self-approval
		if ($entity->get('requestedById') === $this->getUser()->getId()) {
			throw new Forbidden('You cannot approve your own request');
		}
	}
}