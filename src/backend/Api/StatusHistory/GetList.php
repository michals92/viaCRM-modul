<?php

namespace Espo\Modules\Viacrm\Api\StatusHistory;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\ORM\EntityManager;
use stdClass;

class GetList implements Action {

	public function __construct(
		private readonly EntityManager $entityManager
	) {}

	public function process(Request $request): Response {
		$entityType = $request->getQueryParam('entityType');
		$entityId = $request->getQueryParam('entityId');

		if (!$entityType || !$entityId) {
			throw new BadRequest('Missing required parameters: entityType and entityId');
		}

		$list = $this->getStatusHistoryFromNotes($entityType, $entityId);

		return ResponseComposer::json([
			'list' => $list,
			'total' => count($list),
		]);
	}

	/**
	 * @return array<array{id: string, status: string, updatedAt: string, updatedById: string|null, updatedByName: string|null}>
	 */
	private function getStatusHistoryFromNotes(string $entityType, string $entityId): array {
		// Get old-style Status notes (EspoCRM < 9.1.5)
		$statusNotes = $this->entityManager
			->getRDBRepository('Note')
			->select(['id', 'data', 'createdAt', 'createdById'])
			->select('createdBy.name', 'createdByName')
			->leftJoin('createdBy')
			->where([
				'parentType' => $entityType,
				'parentId' => $entityId,
				'type' => 'Status',
			])
			->order('createdAt', 'ASC')
			->find();

		// Get new-style Update notes with status changes (EspoCRM >= 9.1.5)
		$updateNotes = $this->entityManager
			->getRDBRepository('Note')
			->select(['id', 'data', 'createdAt', 'createdById'])
			->select('createdBy.name', 'createdByName')
			->leftJoin('createdBy')
			->where([
				'parentType' => $entityType,
				'parentId' => $entityId,
				'type' => 'Update',
			])
			->order('createdAt', 'ASC')
			->find();

		$list = [];

		// Process old-style Status notes
		foreach ($statusNotes as $note) {
			$data = $note->get('data');

			if (!$data instanceof stdClass || !isset($data->value)) {
				continue;
			}

			$list[] = [
				'id' => $note->getId(),
				'status' => $data->value,
				'updatedAt' => $note->get('createdAt'),
				'updatedById' => $note->get('createdById'),
				'updatedByName' => $note->get('createdByName'),
			];
		}

		// Process new-style Update notes (only those with 'value' field for status changes)
		foreach ($updateNotes as $note) {
			$data = $note->get('data');

			if (!$data instanceof stdClass || !isset($data->value)) {
				continue;
			}

			$list[] = [
				'id' => $note->getId(),
				'status' => $data->value,
				'updatedAt' => $note->get('createdAt'),
				'updatedById' => $note->get('createdById'),
				'updatedByName' => $note->get('createdByName'),
			];
		}

		// Sort all entries by timestamp
		usort($list, function ($a, $b) {
			return strcmp($a['updatedAt'], $b['updatedAt']);
		});

		return $list;
	}

}
