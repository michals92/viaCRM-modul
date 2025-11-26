<?php

namespace Espo\Modules\Viacrm\Services;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;
use Espo\Modules\Viacrm\Entities\ProductSerial as ProductSerialEntity;
use Espo\Modules\Viacrm\Repositories\ProductSerial as ProductSerialRepository;
use Espo\ORM\Collection;

class ProductSerial extends \Espo\Core\Templates\Services\Base {
	/**
	 * Create batch of serial numbers for a product.
	 *
	 * @param array<string, mixed> $data
	 *
	 * @return array<int, ProductSerialEntity>
	 */
	public function createBatch(string $productId, int $quantity, array $data = []): array {
		$em = $this->entityManager;
		$product = $em->getEntityById('Product', $productId) ?? throw new NotFound('Product not found');

		$createdSerials = [];

		// Start transaction for batch creation
		$em->getTransactionManager()->start();

		try {
			for ($i = 0; $i < $quantity; $i++) {
				$serialData = array_merge($data, [
				    'productId' => $product->getId(),
				    'status' => 'Active',
				]);

				// Remove empty values
				$serialData = array_filter($serialData, function ($value) {
					return $value !== null && $value !== '';
				});

				/** @var ProductSerialEntity $serial */
				$serial = $em->createEntity('ProductSerial', $serialData);
				$createdSerials[] = $serial;
			}

			$em->getTransactionManager()->commit();
		} catch (\Exception $e) {
			$em->getTransactionManager()->rollback();
			throw new BadRequest('Failed to create serial numbers: ' . $e->getMessage());
		}

		return $createdSerials;
	}

	/**
	 * Change status of serial number.
	 *
	 * @param array<string, mixed> $data
	 */
	public function changeStatus(string $serialId, string $newStatus, array $data = []): void {
		$em = $this->entityManager;
		/** @var ?ProductSerialEntity $serial */
		$serial = $em->getEntityById('ProductSerial', $serialId);

		if (!$serial) {
			throw new NotFound('Serial number not found');
		}

		$validStatuses = ['Active', 'Sold', 'Defective', 'Returned', 'Scrapped'];
		if (!in_array($newStatus, $validStatuses)) {
			throw new BadRequest("Invalid status: $newStatus");
		}

		$reason = $data['reason'] ?? null;
		$serial->changeStatus($newStatus, $reason);

		$em->saveEntity($serial);
	}

	/**
	 * Find serial by serial number.
	 */
	public function findBySerialNumber(string $serialNumber): ?ProductSerialEntity {
		/** @var ProductSerialRepository $repo */
		$repo = $this->getRepository();

		return $repo->findBySerialNumber($serialNumber);
	}

	/**
	 * Find serials by product.
	 *
	 * @param array<string, mixed> $params
	 *
	 * @return Collection<ProductSerialEntity>
	 */
	public function findByProduct(string $productId, array $params = []): Collection {
		/** @var ProductSerialRepository $repo */
		$repo = $this->getRepository();

		return $repo->findByProduct($productId, $params);
	}

	/**
	 * Get statistics for product serials.
	 *
	 * @return array{total: int, byStatus: array<string, int>, underWarranty: int}
	 */
	public function getProductStatistics(string $productId): array {
		$repository = $this->getRepository();

		$total = $repository->where(['productId' => $productId])->count();

		$statusStats = [];
		$statuses = ['Active', 'Sold', 'Defective', 'Returned', 'Scrapped'];

		foreach ($statuses as $status) {
			$count = $repository->where([
			    'productId' => $productId,
			    'status' => $status,
			])->count();

			$statusStats[$status] = $count;
		}

		$underWarranty = $repository->where([
		    'productId' => $productId,
		    'warrantyUntil>' => date('Y-m-d'),
		])->count();

		return [
		    'total' => $total,
		    'byStatus' => $statusStats,
		    'underWarranty' => $underWarranty,
		];
	}

	/**
	 * Transfer ownership of serial.
	 */
	public function transferOwnership(string $serialId, string $newOwnerId, ?string $reason = null): void {
		$em = $this->entityManager;
		/** @var ?ProductSerialEntity $serial */
		$serial = $em->getEntityById('ProductSerial', $serialId);

		if (!$serial) {
			throw new NotFound('Serial number not found');
		}

		$newOwner = $em->getEntityById('Account', $newOwnerId);

		if (!$newOwner) {
			throw new NotFound('New owner account not found');
		}

		$oldOwnerId = $serial->get('currentOwnerId');
		$oldOwnerName = $oldOwnerId ?
		    $em->getEntityById('Account', $oldOwnerId)?->get('name') :
		    'None';

		$serial->set('currentOwnerId', $newOwnerId);

		$note = "Ownership transferred from '$oldOwnerName' to '{$newOwner->get('name')}'";
		if ($reason) {
			$note .= " - Reason: $reason";
		}

		$serial->addNote($note);

		$em->saveEntity($serial);
	}

	/**
	 * Set warranty period for serial.
	 */
	public function setWarranty(string $serialId, string $warrantyUntil): void {
		$em = $this->entityManager;
		/** @var ?ProductSerialEntity $serial */
		$serial = $em->getEntityById('ProductSerial', $serialId);

		if (!$serial) {
			throw new NotFound('Serial number not found');
		}

		$serial->set('warrantyUntil', $warrantyUntil);
		$serial->addNote("Warranty period set until: $warrantyUntil");

		$em->saveEntity($serial);
	}
}
