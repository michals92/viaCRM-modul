<?php

namespace Espo\Modules\Viacrm\Classes\FieldProcessing\Role;

use Espo\Core\FieldProcessing\Loader as FieldLoader;
use Espo\Core\FieldProcessing\Loader\Params as LoaderParams;
use Espo\Entities\Role;
use Espo\ORM\Entity;

/**
 * @implements FieldLoader<Role>
 */
class UsersLoader implements FieldLoader
{
	public function process(Entity $entity, LoaderParams $params): void
	{
		$entity->loadLinkMultipleField('users');
	}
}
