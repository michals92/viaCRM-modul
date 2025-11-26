<?php

namespace Espo\Modules\Viacrm\Entities;

use Espo\Core\ORM\Entity;

/**
 * Class ProductSupplierItem
 * Represents a link between a product and a supplier with additional attributes.
 */
class ProductSupplierItem extends Entity {
	public const string TEMPLATE_TYPE = 'Base';

	public const string ENTITY_TYPE = 'ProductSupplierItem';

	/**
	 * Get the ID of the supplier (account) associated with this item.
	 * Since the account field is required in the entity definition, this should always return a string.
	 *
	 * @throws \LogicException If accountId is not set (which would indicate a data integrity issue)
	 *
	 * @return string The supplier ID
	 */
	public function getSupplierId(): string {
		$accountId = $this->get('accountId');

		if ($accountId === null) {
			throw new \LogicException(sprintf(
				'ProductSupplierItem entity (ID: %s) has no associated supplier, but account is a required field.',
				$this->getId()
			));
		}

		return $accountId;
	}

	/**
	 * Get the cost price of this supplier item.
	 *
	 * @return float|null The cost price or null if not set
	 */
	public function getCostPrice(): ?float {
		return $this->get('costPrice');
	}

	/**
	 * Get the delivery time in days for this supplier item.
	 *
	 * @return int|null The delivery time in days or null if not set
	 */
	public function getDeliveryTime(): ?int {
		return $this->get('deliveryTime');
	}

	/**
	 * Check if this supplier item can meet a deadline given the days remaining.
	 * If delivery time is not specified (null), we assume the supplier cannot meet the deadline.
	 *
	 * @param int $daysRemaining Number of days remaining until deadline
	 *
	 * @return bool True if the supplier can deliver in time
	 */
	public function canMeetDeadline(int $daysRemaining): bool {
		$deliveryTime = $this->getDeliveryTime();
		// If delivery time is not specified, we cannot guarantee delivery by deadline
		if ($deliveryTime === null) {
			return false;
		}

		return $deliveryTime <= $daysRemaining;
	}
}
