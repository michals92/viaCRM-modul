<?php

namespace Espo\Modules\Autocrm\Core\Record\Hook;

use Espo\Core\Binding\BindingContainer;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Metadata;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use ReflectionClass;
use ReflectionException;
use RuntimeException;

class Provider extends \Espo\Core\Record\Hook\Provider {

	/** @var array<string, object[]> */
	private array $map = [];

	/**
	 * @throws ReflectionException
	 * @return object[]
	 */
	public function getList(string $entityType, string $type): array {
		$key = $entityType . '_' . $type;

		if (!array_key_exists($key, $this->map)) {
			$this->map[$key] = $this->loadList($entityType, $type);
		}

		return $this->map[$key];
	}

	/**
	 * @throws ReflectionException
	 * @return object[]
	 */
	private function loadList(string $entityType, string $type): array {
		$key = $type . 'HookClassNameList';
		$suppressKey = $type . 'SuppressClassNameList';

		/** @var Metadata $metadata */
		$metadata = ReflectionUtil::getClassProperty(parent::class, $this, 'metadata');
		/** @var class-string[] $classNameList */
		$classNameList = $metadata->get(['recordDefs', $entityType, $key]) ?? [];

		/** @var class-string[] $suppressClassNameList */
		$suppressClassNameList = $metadata->get(['recordDefs', $entityType, $suppressKey]) ?? [];
		/** @var array<string, class-string[]> $typeInterfaceListMap */
		$typeInterfaceListMap = ReflectionUtil::getClassProperty(parent::class, $this, 'typeInterfaceListMap');

		$interfaces = $typeInterfaceListMap[$type] ?? null;

		if (!$interfaces) {
			throw new RuntimeException("Unsupported record hook type '$type'.");
		}

		$list = [];
		/** @var InjectableFactory $injectableFactory */
		$injectableFactory = ReflectionUtil::getClassProperty(parent::class, $this, 'injectableFactory');
		/** @var BindingContainer $bindingContainer */
		$bindingContainer = ReflectionUtil::getClassProperty(parent::class, $this, 'bindingContainer');

		foreach ($classNameList as $className) {
			// Skip if the hook is in the suppressList
			if (in_array($className, $suppressClassNameList)) {
				continue;
			}

			$class = new ReflectionClass($className);

			$found = false;

			foreach ($interfaces as $interface) {
				if ($class->implementsInterface($interface)) {
					$found = true;

					break;
				}
			}

			if (!$found) {
				throw new RuntimeException("Hook '$className' does not implement any required interface.");
			}

			$list[] = $injectableFactory->createWithBinding($className, $bindingContainer);
		}

		return $list;
	}

}
