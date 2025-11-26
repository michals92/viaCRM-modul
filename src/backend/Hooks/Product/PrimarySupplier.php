<?php

namespace Espo\Modules\Viacrm\Hooks\Product;

use Espo\Core\Hook\Hook\AfterSave;
use Espo\Modules\Viacrm\Entities\Product;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements AfterSave<Product>
 */
class PrimarySupplier implements AfterSave
{
	public static int $order = 9;

	public function __construct()
	{
	}

	public function afterSave(Entity $entity, SaveOptions $options): void
	{
		// needs attention > rn its not possible to have record-list (link-multiple) with primary
		return;
		// phpcs:ignore Generic.CodeAnalysis.UnreachableCode.Detected
		/** @phpstan-ignore-next-line */
		if (!$entity->isAttributeChanged('primarySupplierId')) {
			return;
		}

		$supplierId = $entity->get('primarySupplierId');
		$fetchedSupplierId = $entity->getFetched('primarySupplierId');

		$relation = $this->entityManager
			->getRelation($entity, 'suppliers');

		if (!$supplierId) {
			if ($fetchedSupplierId) {
				$relation->unrelateById($fetchedSupplierId);
			}
		} else {
			$relation->relateById($supplierId);
		}
	}
}
