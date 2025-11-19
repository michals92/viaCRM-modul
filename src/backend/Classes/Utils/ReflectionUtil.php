<?php

namespace Espo\Modules\Autocrm\Classes\Utils;

use ReflectionException;
use ReflectionMethod;
use ReflectionProperty;

class ReflectionUtil {

	/**
	 * @param  class-string        $className
	 * @param  mixed               ...$args
	 * @throws ReflectionException
	 */
	public static function callClassMethod(string $className, object $obj, string $methodName, mixed ...$args): mixed {
		return (new ReflectionMethod($className, $methodName))->invoke($obj, ...$args);
	}

	/**
	 * @param  mixed               ...$args
	 * @throws ReflectionException
	 */
	public static function callMethod(object $obj, string $methodName, mixed ...$args): mixed {
		return (new ReflectionMethod($obj, $methodName))->invoke($obj, ...$args);
	}

	/**
	 * @param  class-string        $className
	 * @param  mixed               ...$args
	 * @throws ReflectionException
	 */
	public static function callClassStaticMethod(string $className, string $methodName, mixed ...$args): mixed {
		return (new ReflectionMethod($className, $methodName))->invoke(null, ...$args);
	}

	/**
	 * @param class-string $className
	 *
	 * @throws ReflectionException
	 */
	public static function redefineClassProperty(string $className, object $obj, string $propertyName, callable $callback): void {
		$prop = self::getClassProperty($className, $obj, $propertyName);

		$value = $callback($prop);

		self::setClassProperty($className, $obj, $propertyName, $value);
	}

	/**
	 * @throws ReflectionException
	 */
	public static function getProperty(object $obj, string $propertyName): mixed {
		return (new ReflectionProperty($obj, $propertyName))->getValue($obj);
	}

	/**
	 * @param class-string $className
	 *
	 * @throws ReflectionException
	 */
	public static function getClassProperty(string $className, object $obj, string $propertyName): mixed {
		return (new ReflectionProperty($className, $propertyName))->getValue($obj);
	}

	/**
	 * @throws ReflectionException
	 */
	public static function setProperty(object $obj, string $propertyName, mixed $value): void {
		(new ReflectionProperty($obj, $propertyName))->setValue($obj, $value);
	}

	/**
	 * @param class-string $className
	 *
	 * @throws ReflectionException
	 */
	public static function setClassProperty(string $className, object $obj, string $propertyName, mixed $value): void {
		(new ReflectionProperty($className, $propertyName))->setValue($obj, $value);
	}

	public static function createClassIfNotExists(string $className, string $code): void {
		if (!class_exists($className, false)) {
			eval($code);
		}
	}

	public static function classMethodExists(string $className, string $methodName): bool {
		return method_exists($className, $methodName);
	}

	public static function classMethodHasParamCount(string $className, string $methodName, int $count): bool {
		return count((new ReflectionMethod($className, $methodName))->getParameters()) === $count;
	}

}
