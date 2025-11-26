<?php

namespace Espo\Modules\Viacrm\Classes\FieldProcessing\Product;

use Espo\Core\FieldProcessing\Loader;
use Espo\Core\FieldProcessing\Loader\Params;
use Espo\Core\ORM\EntityManager;
use Espo\Modules\Viacrm\Entities\Product;
use Espo\ORM\Entity;

/**
 * @implements Loader<Product>
 */
class OrderedLoader implements Loader {
	public function __construct(
		private readonly EntityManager $entityManager
	) {}

	public function process(Entity $entity, Params $params): void {
		$em = $this->entityManager;
		if ($em->hasRepository('PurchaseOrderItem')) {
			$ordered = (bool) $em
			    ->getRDBRepository('PurchaseOrderItem')
			    ->select(['id'])
			    ->where('productId', $entity->getId())
			    ->findOne();

			$entity->set('ordered', $ordered);
		}
	}
}
