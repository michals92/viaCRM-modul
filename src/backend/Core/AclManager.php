<?php

namespace Espo\Modules\Viacrm\Core;

use Espo\Core\InjectableFactory;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Viacrm\Core\Acl\AccessEntityPrintChecker;
use Espo\Modules\Viacrm\Core\Acl\AccessPrintChecker;
use ReflectionClass;

class AclManager extends \Espo\Core\AclManager
{
	public function __construct(
		InjectableFactory $injectableFactory
	) {
		ReflectionUtil::redefineClassProperty(parent::class, $this, 'entityActionInterfaceMap', function ($map) {
			$map['print'] = AccessEntityPrintChecker::class;

			return $map;
		});

		ReflectionUtil::redefineClassProperty(parent::class, $this, 'actionInterfaceMap', function ($map) {
			$map['print'] = AccessPrintChecker::class;

			return $map;
		});

		$parentConstructorArgs = ReflectionUtil::callMethod($injectableFactory, 'getConstructorInjectionList', new ReflectionClass(parent::class));

		parent::__construct(...$parentConstructorArgs);
	}
}
