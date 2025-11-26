<?php

namespace Espo\Modules\Viacrm\Core\Select\Applier;

use Espo\Core\InjectableFactory;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Viacrm\Core\Select\Text\Applier as TextFilterApplier;
use ReflectionClass;
use ReflectionException;

class Factory extends \Espo\Core\Select\Applier\Factory
{
	/**
	 * @var array<string, class-string<object>>
	 */
	private array $overrideDefaultClassNameMap = [
		self::TEXT_FILTER => TextFilterApplier::class,
	];

	/**
	 * @throws ReflectionException
	 */
	public function __construct(
		InjectableFactory $injectableFactory
	) {
		$parentConstructorArgs = ReflectionUtil::callMethod($injectableFactory, 'getConstructorInjectionList', new ReflectionClass(parent::class));

		parent::__construct(...$parentConstructorArgs);

		ReflectionUtil::redefineClassProperty(parent::class, $this, 'defaultClassNameMap', function ($defaultClassNameMap) {
			return array_merge($defaultClassNameMap ?? [], $this->overrideDefaultClassNameMap);
		});
	}
}
