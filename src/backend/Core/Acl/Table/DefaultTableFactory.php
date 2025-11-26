<?php

namespace Espo\Modules\Viacrm\Core\Acl\Table;

use Espo\Core\Acl\Table;
use Espo\Core\Binding\Binder;
use Espo\Core\Binding\BindingContainer;
use Espo\Core\Binding\BindingData;
use Espo\Core\InjectableFactory;
use Espo\Entities\User;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;

class DefaultTableFactory extends \Espo\Core\Acl\Table\DefaultTableFactory
{
	public function __construct(
		private readonly InjectableFactory $injectableFactory
	) {
	}

	public function create(User $user): Table
	{
		$childbindingContainer = ReflectionUtil::callClassMethod(parent::class, $this, 'createBindingContainer', $user);

		$bindingData = new BindingData();

		$bindingContainer = new BindingContainer($bindingData);

		$binder = new Binder($bindingData);

		$binder
			->for(DefaultTable::class)
			->bindValue('$bindingContainer', $childbindingContainer);

		// Have to create with InjectableFactory because of Di trait
		return $this->injectableFactory->createWithBinding(DefaultTable::class, $bindingContainer);
	}
}
