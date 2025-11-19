<?php

namespace Espo\Modules\Autocrm\Core\Workflow;

use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Metadata;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use ReflectionClass;
use ReflectionException;

/** @disregard */
ReflectionUtil::createClassIfNotExists(
	\Espo\Modules\Advanced\Core\Workflow\ActionManager::class,
	<<<'PHP'
    namespace Espo\Modules\Advanced\Core\Workflow;
    
    class ActionManager {}
    PHP
);

/** @disregard */
class ActionManager extends \Espo\Modules\Advanced\Core\Workflow\ActionManager {

	private Metadata $metadata;

	/**
	 * @throws ReflectionException
	 */
	public function __construct(
		\Espo\Core\Container $container,
		InjectableFactory $injectableFactory
	) {
		$this->metadata = $container->getByClass(Metadata::class);
		$actionClassNameMap = $this->metadata->get(['app', 'workflow', 'actionClassNameMap'], []);

		if (!empty($actionClassNameMap)) {
			$actionClassNameMap = array_combine(
				array_map(fn($key) => ucfirst((string)$key), array_keys($actionClassNameMap)),
				array_values($actionClassNameMap)
			);
		}

		/** @disregard */
		ReflectionUtil::redefineClassProperty(
			\Espo\Modules\Advanced\Core\Workflow\BaseManager::class,
			$this,
			'actionClassNameMap',
			static fn($property) => $property + $actionClassNameMap
		);

		$parentConstructorArgs = ReflectionUtil::callMethod($injectableFactory, 'getConstructorInjectionList', new ReflectionClass(parent::class));

		parent::__construct(...$parentConstructorArgs);
	}

}