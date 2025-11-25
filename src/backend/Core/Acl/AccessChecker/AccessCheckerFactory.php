<?php

namespace Espo\Modules\Viacrm\Core\Acl\AccessChecker;

use Espo\Core\InjectableFactory;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Viacrm\Core\Acl\DefaultAccessChecker;
use ReflectionClass;

class AccessCheckerFactory extends \Espo\Core\Acl\AccessChecker\AccessCheckerFactory {

	public function __construct(
		InjectableFactory $injectableFactory
	) {
		ReflectionUtil::setClassProperty(parent::class, $this, 'defaultClassName', DefaultAccessChecker::class);

		$parentConstructorArgs = ReflectionUtil::callMethod($injectableFactory, 'getConstructorInjectionList', new ReflectionClass(parent::class));

		parent::__construct(...$parentConstructorArgs);
	}

}