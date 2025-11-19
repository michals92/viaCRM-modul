<?php

namespace Espo\Modules\Autocrm\Core;

use Espo\Core\InjectableFactory;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Autocrm\Core\Workflow\ActionManager;
use ReflectionClass;

/** @disregard */
ReflectionUtil::createClassIfNotExists(
	\Espo\Modules\Advanced\Core\WorkflowManager::class,
	<<<'PHP'
    namespace Espo\Modules\Advanced\Core;
    
    class WorkflowManager {}
    PHP
);

class WorkflowManager extends \Espo\Modules\Advanced\Core\WorkflowManager {

	public function __construct(
		\Espo\Core\Container $container,
		InjectableFactory $injectableFactory
	) {
		$parentConstructorArgs = ReflectionUtil::callMethod($injectableFactory, 'getConstructorInjectionList', new ReflectionClass(parent::class));

		parent::__construct(...$parentConstructorArgs);

		ReflectionUtil::setClassProperty(
			\Espo\Modules\Advanced\Core\WorkflowManager::class,
			$this,
			'actionManager',
			new ActionManager($container, $injectableFactory)
		);
	}

}
