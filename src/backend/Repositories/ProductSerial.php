<?php

namespace Espo\Modules\Viacrm\Repositories;

use Espo\Core\Exceptions\BadRequest;
use Espo\Modules\Viacrm\Entities\ProductSerial as ProductSerialEntity;
use Espo\ORM\Collection;
use Espo\ORM\Entity;

class ProductSerial extends \Espo\Core\Templates\Repositories\Base
{
	/**
	 * Find serial by serial number.
	 *
	 * @return ?ProductSerialEntity
	 */
	public function findBySerialNumber(string $serialNumber): ?Entity
	{
		/** @var ?ProductSerialEntity */
		$entity = $this->where(['serialNumber' => $serialNumber])->findOne();

		return $entity;
	}

	/**
	 * Find serials by product.
	 *
	 * @param array<string, mixed> $params
	 *
	 * @return Collection<ProductSerialEntity>
	 */
	public function findByProduct(string $productId, array $params = []): Collection
	{
		$query = $this->where(['productId' => $productId]);

		if (isset($params['status'])) {
			$query->where(['status' => $params['status']]);
		}

		if (isset($params['batchNumber'])) {
			$query->where(['batchNumber' => $params['batchNumber']]);
		}

		/** @var Collection<ProductSerialEntity> */
		$collection = $query->order('serialNumber')->find();

		return $collection;
	}

	/**
	 * Check if serial number already exists for a specific product.
	 */
	public function serialNumberExists(string $serialNumber, ?string $excludeId = null, ?string $productId = null): bool
	{
		$query = $this->where(['serialNumber' => $serialNumber]);

		if ($productId) {
			$query->where(['productId' => $productId]);
		}

		if ($excludeId) {
			$query->where(['id!=' => $excludeId]);
		}

		return $query->count() > 0;
	}

	/**
	 * Get next serial number for product.
	 */
	public function getNextSerialNumber(string $productId): string
	{
		$product = $this->entityManager->getEntityById('Product', $productId);

		if (!$product) {
			throw new BadRequest('Product not found');
		}

		// Get product code for serial format
		$productCode = $product->get('code') ?? $product->get('name');
		$productCode = strtoupper(preg_replace('/[^A-Z0-9]/', '', $productCode));
		$productCode = substr($productCode, 0, 6); // Limit to 6 chars

		if (empty($productCode)) {
			$productCode = 'PROD';
		}

		$year = date('Y');
		$prefix = "$productCode-$year-";

		// Find highest existing number for this prefix
		$lastSerial = $this->where([
			'productId' => $productId,
			'serialNumber*' => $prefix . '%',
		])
			->order('serialNumber', 'DESC')
			->findOne();

		$nextNumber = 1;

		if ($lastSerial) {
			$lastSerialNumber = $lastSerial->get('serialNumber');
			$numberPart = substr($lastSerialNumber, strlen($prefix));

			if (is_numeric($numberPart)) {
				$nextNumber = (int) $numberPart + 1;
			}
		}

		// Generate with 4-digit padding
		return $prefix . sprintf('%04d', $nextNumber);
	}

	/**
	 * Before save operations.
	 *
	 * @throws BadRequest
	 */
	protected function beforeSave(Entity $entity, array $options = []): void
	{
		parent::beforeSave($entity, $options);

		// Auto-generate serial number if not provided
		if (!$entity->get('serialNumber') && $entity->get('productId')) {
			$serialNumber = $this->getNextSerialNumber($entity->get('productId'));
			$entity->set('serialNumber', $serialNumber);
		}

		// Validate serial number uniqueness per product
		if ($entity->get('serialNumber') && $entity->get('productId')) {
			$excludeId = $entity->isNew() ? null : $entity->getId();

			if ($this->serialNumberExists($entity->get('serialNumber'), $excludeId, $entity->get('productId'))) {
				throw new BadRequest("Serial number '{$entity->get('serialNumber')}' already exists for this product");
			}
		}

		// Set manufactured date if not provided
		if (!$entity->get('manufacturedDate') && $entity->isNew()) {
			$entity->set('manufacturedDate', date('Y-m-d'));
		}

		// Auto-calculate warranty until date if not set
		if (!$entity->get('warrantyUntil') && $entity->get('productId') && $entity->isNew()) {
			$this->setDefaultWarranty($entity);
		}
	}

	/**
	 * Set default warranty period based on product.
	 */
	private function setDefaultWarranty(Entity $entity): void
	{
		$product = $this->entityManager->getEntityById('Product', $entity->get('productId'));

		if (!$product) {
			return;
		}

		// Check if product has warranty period defined
		$warrantyMonths = $product->get('warrantyMonths') ?? 12; // Default 12 months

		$manufacturedDate = $entity->get('manufacturedDate') ?: date('Y-m-d');
		$timestamp = strtotime($manufacturedDate . " + $warrantyMonths months");
		if ($timestamp !== false) {
			$warrantyUntil = date('Y-m-d', $timestamp);
			$entity->set('warrantyUntil', $warrantyUntil);
		}
	}

	/**
	 * Get count by status for product.
	 */
	public function getStatusCount(string $productId, string $status): int
	{
		return $this->where([
			'productId' => $productId,
			'status' => $status,
		])->count();
	}

	/**
	 * Get serials expiring warranty soon.
	 *
	 * @return Collection<ProductSerialEntity>
	 */
	public function getWarrantyExpiring(int $daysAhead = 30): Collection
	{
		$timestamp = strtotime("+$daysAhead days");
		$dateLimit = $timestamp !== false ? date('Y-m-d', $timestamp) : date('Y-m-d');

		/** @var Collection<ProductSerialEntity> */
		$collection = $this->where([
			'warrantyUntil<=' => $dateLimit,
			'warrantyUntil>' => date('Y-m-d'),
			'status' => ['Active', 'Sold'],
		])->find();

		return $collection;
	}
}
