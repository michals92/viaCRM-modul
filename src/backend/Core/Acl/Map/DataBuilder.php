<?php

namespace Espo\Modules\Viacrm\Core\Acl\Map;

use Espo\Core\InjectableFactory;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use ReflectionClass;

class DataBuilder extends \Espo\Core\Acl\Map\DataBuilder {

	const ACTION_PRINT = 'print';

	public function __construct(
		InjectableFactory $injectableFactory
	) {
		$parentConstructorArgs = ReflectionUtil::callMethod($injectableFactory, 'getConstructorInjectionList', new ReflectionClass(parent::class));

		// Add print to action list so that the level of print is properly exposed to the frontend
		ReflectionUtil::redefineClassProperty(parent::class, $this, 'actionList', static fn ($actionList) => [...$actionList, self::ACTION_PRINT]);

		parent::__construct(...$parentConstructorArgs);
	}

}