<?php

namespace Espo\Modules\Viacrm\Repositories;

use Espo\Modules\Viacrm\Entities\ProductCategory as ProductCategoryEntity;

/**
 * @template TEntity of \Espo\Core\Entities\CategoryTreeItem
 *
 * @extends \Espo\Core\Templates\Repositories\CategoryTree<ProductCategoryEntity>
 */
class ProductCategory extends \Espo\Core\Templates\Repositories\CategoryTree
{
}
