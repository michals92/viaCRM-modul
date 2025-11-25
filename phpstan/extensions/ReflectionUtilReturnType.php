<?php

namespace ViacrmDev\PHPStan\Extensions;

use PhpParser\Node;
use PhpParser\Node\Expr\StaticCall;
use PHPStan\Analyser\Scope;
use PHPStan\Reflection\ReflectionProvider;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;
use PHPStan\Type\Constant\ConstantStringType;
use PHPStan\Type\ObjectType;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;

/**
 * Rule that validates calls to static methods in ReflectionUtil
 */
class ReflectionUtilReturnType implements Rule
{
    private $supportedMethodNameList = [
        'callClassMethod',
        'callMethod',
        'callClassStaticMethod',
        'redefineClassProperty',
        'getProperty',
        'getClassProperty',
        'setProperty',
        'setClassProperty'
    ];

    public function __construct(
        private ReflectionProvider $reflectionProvider
    ) {}

    public function getNodeType(): string
    {
        return StaticCall::class;
    }

    /**
     * @param StaticCall $node
     * @param Scope $scope
     * @return array<\PHPStan\Rules\RuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        if (!$node->name instanceof Node\Identifier) {
            return [];
        }

        $methodName = $node->name->toString();
        
        // Only process methods we're interested in
        if (!in_array($methodName, $this->supportedMethodNameList, true)) {
            return [];
        }

        // Check if the static call is to ReflectionUtil
        if (!$node->class instanceof Node\Name) {
            return [];
        }

        $className = $node->class->toString();
        if ($className !== ReflectionUtil::class && !is_subclass_of($className, ReflectionUtil::class)) {
            return [];
        }

        // Process based on method name
        switch ($methodName) {
            case 'callClassMethod':
                return $this->validateCallClassMethod($node, $scope);

            case 'callMethod':
                return $this->validateCallMethod($node, $scope);

            case 'callClassStaticMethod':
                return $this->validateCallClassStaticMethod($node, $scope);

            case 'redefineClassProperty':
                return $this->validateRedefineClassProperty($node, $scope);

            case 'getProperty':
                return $this->validateGetProperty($node, $scope);

            case 'getClassProperty':
                return $this->validateGetClassProperty($node, $scope);

            case 'setProperty':
                return $this->validateSetProperty($node, $scope);

            case 'setClassProperty':
                return $this->validateSetClassProperty($node, $scope);
        }

        return [];
    }

    /**
     * Get available methods list for a class
     */
    private function getAvailableMethods($classReflection): string
    {
        try {
            $methods = $classReflection->getMethods();
            $methodNames = array_map(function($method) {
                return $method->getName();
            }, $methods);
            
            sort($methodNames);
            return !empty($methodNames) 
                ? implode(', ', $methodNames) 
                : "(No methods found)";
        } catch (\Throwable $e) {
            return "(couldn't retrieve method list: " . $e->getMessage() . ")";
        }
    }
    
    /**
     * Get available properties list for a class
     */
    private function getAvailableProperties($classReflection): string
    {
        try {
            $properties = $classReflection->getProperties();
            $propertyNames = array_map(function($property) {
                return $property->getName();
            }, $properties);
            
            sort($propertyNames);
            return !empty($propertyNames) 
                ? implode(', ', $propertyNames) 
                : "(No properties found)";
        } catch (\Throwable $e) {
            return "(couldn't retrieve property list: " . $e->getMessage() . ")";
        }
    }

    /**
     * Validates calls to callClassMethod(string $className, object $obj, string $methodName, ...$args)
     */
    private function validateCallClassMethod(StaticCall $node, Scope $scope): array
    {
        $args = $node->getArgs();
        if (count($args) < 3) {
            return [
                RuleErrorBuilder::message(
                    'Method ReflectionUtil::callClassMethod requires at least 3 arguments'
                )->build()
            ];
        }

        // Get $className and $methodName arguments
        $classNameType = $scope->getType($args[0]->value);
        $methodNameType = $scope->getType($args[2]->value);

        if (!$classNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $className argument of ReflectionUtil::callClassMethod must be a string literal for static analysis'
                )->build()
            ];
        }

        if (!$methodNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $methodName argument of ReflectionUtil::callClassMethod must be a string literal for static analysis'
                )->build()
            ];
        }

        $className = $classNameType->getValue();
        $methodName = $methodNameType->getValue();

        // Check if class exists
        if (!$this->reflectionProvider->hasClass($className)) {
            return [
                RuleErrorBuilder::message(
                    sprintf('Class "%s" used in ReflectionUtil::callClassMethod was not found', $className)
                )->build()
            ];
        }

        $classReflection = $this->reflectionProvider->getClass($className);

        // Check if method exists on the class
        if (!$classReflection->hasMethod($methodName)) {
            $availableMethods = $this->getAvailableMethods($classReflection);
            
            return [
                RuleErrorBuilder::message(
                    sprintf(
                        'Method "%s" does not exist on class "%s". Available methods: %s', 
                        $methodName, 
                        $className,
                        $availableMethods
                    )
                )->build()
            ];
        }

        return [];
    }

    /**
     * Validates calls to callMethod(object $obj, string $methodName, ...$args)
     */
    private function validateCallMethod(StaticCall $node, Scope $scope): array
    {
        $args = $node->getArgs();
        if (count($args) < 2) {
            return [
                RuleErrorBuilder::message(
                    'Method ReflectionUtil::callMethod requires at least 2 arguments'
                )->build()
            ];
        }

        // Get $methodName argument
        $methodNameType = $scope->getType($args[1]->value);

        if (!$methodNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $methodName argument of ReflectionUtil::callMethod must be a string literal for static analysis'
                )->build()
            ];
        }

        // Check object argument
        $objectType = $scope->getType($args[0]->value);
        if (!$objectType instanceof ObjectType) {
            // We can't determine the object type, so we can't validate the method
            return [];
        }

        $methodName = $methodNameType->getValue();

        // The class is obtained from the ObjectType
        $className = $objectType->getClassName();
        
        // Check if class exists
        if (!$this->reflectionProvider->hasClass($className)) {
            return []; // Can't verify further if class doesn't exist
        }
        
        $classReflection = $this->reflectionProvider->getClass($className);
        
        // Check if method exists on the class
        if (!$classReflection->hasMethod($methodName)) {
            $availableMethods = $this->getAvailableMethods($classReflection);
            
            return [
                RuleErrorBuilder::message(
                    sprintf(
                        'Method "%s" does not exist on class "%s". Available methods: %s', 
                        $methodName, 
                        $classReflection->getDisplayName(),
                        $availableMethods
                    )
                )->build()
            ];
        }

        return [];
    }

    /**
     * Validates calls to callClassStaticMethod(string $className, string $methodName, ...$args)
     */
    private function validateCallClassStaticMethod(StaticCall $node, Scope $scope): array
    {
        $args = $node->getArgs();
        if (count($args) < 2) {
            return [
                RuleErrorBuilder::message(
                    'Method ReflectionUtil::callClassStaticMethod requires at least 2 arguments'
                )->build()
            ];
        }

        // Get $className and $methodName arguments
        $classNameType = $scope->getType($args[0]->value);
        $methodNameType = $scope->getType($args[1]->value);

        if (!$classNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $className argument of ReflectionUtil::callClassStaticMethod must be a string literal for static analysis'
                )->build()
            ];
        }

        if (!$methodNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $methodName argument of ReflectionUtil::callClassStaticMethod must be a string literal for static analysis'
                )->build()
            ];
        }

        $className = $classNameType->getValue();
        $methodName = $methodNameType->getValue();

        // Check if class exists
        if (!$this->reflectionProvider->hasClass($className)) {
            return [
                RuleErrorBuilder::message(
                    sprintf('Class "%s" used in ReflectionUtil::callClassStaticMethod was not found', $className)
                )->build()
            ];
        }

        $classReflection = $this->reflectionProvider->getClass($className);

        // Check if method exists on the class
        if (!$classReflection->hasMethod($methodName)) {
            $availableMethods = $this->getAvailableMethods($classReflection);
            
            return [
                RuleErrorBuilder::message(
                    sprintf(
                        'Method "%s" does not exist on class "%s". Available methods: %s', 
                        $methodName, 
                        $className,
                        $availableMethods
                    )
                )->build()
            ];
        }

        // Check if method is static
        $methodReflection = $classReflection->getMethod($methodName, $scope);
        if (!$methodReflection->isStatic()) {
            return [
                RuleErrorBuilder::message(
                    sprintf('Method "%s::%s" is not static but called with ReflectionUtil::callClassStaticMethod', $className, $methodName)
                )->build()
            ];
        }

        return [];
    }

    /**
     * Validates calls to redefineClassProperty(string $className, object $obj, string $propertyName, callable $callback)
     */
    private function validateRedefineClassProperty(StaticCall $node, Scope $scope): array
    {
        $args = $node->getArgs();
        if (count($args) < 4) {
            return [
                RuleErrorBuilder::message(
                    'Method ReflectionUtil::redefineClassProperty requires 4 arguments'
                )->build()
            ];
        }

        // Get $className and $propertyName arguments
        $classNameType = $scope->getType($args[0]->value);
        $propertyNameType = $scope->getType($args[2]->value);

        if (!$classNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $className argument of ReflectionUtil::redefineClassProperty must be a string literal for static analysis'
                )->build()
            ];
        }

        if (!$propertyNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $propertyName argument of ReflectionUtil::redefineClassProperty must be a string literal for static analysis'
                )->build()
            ];
        }

        $className = $classNameType->getValue();
        $propertyName = $propertyNameType->getValue();

        // Check if class exists
        if (!$this->reflectionProvider->hasClass($className)) {
            return [
                RuleErrorBuilder::message(
                    sprintf('Class "%s" used in ReflectionUtil::redefineClassProperty was not found', $className)
                )->build()
            ];
        }

        $classReflection = $this->reflectionProvider->getClass($className);

        // Check if property exists
        if (!$classReflection->hasProperty($propertyName)) {
            $availableProperties = $this->getAvailableProperties($classReflection);
            
            return [
                RuleErrorBuilder::message(
                    sprintf(
                        'Property "%s" does not exist on class "%s". Available properties: %s', 
                        $propertyName, 
                        $className,
                        $availableProperties
                    )
                )->build()
            ];
        }

        return [];
    }

    /**
     * Validates calls to getProperty(object $obj, string $propertyName)
     */
    private function validateGetProperty(StaticCall $node, Scope $scope): array
    {
        $args = $node->getArgs();
        if (count($args) < 2) {
            return [
                RuleErrorBuilder::message(
                    'Method ReflectionUtil::getProperty requires 2 arguments'
                )->build()
            ];
        }

        // Get $propertyName argument
        $propertyNameType = $scope->getType($args[1]->value);

        if (!$propertyNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $propertyName argument of ReflectionUtil::getProperty must be a string literal for static analysis'
                )->build()
            ];
        }

        // Check object argument
        $objectType = $scope->getType($args[0]->value);
        if (!$objectType instanceof ObjectType) {
            // We can't determine the object type, so we can't validate the property
            return [];
        }

        $propertyName = $propertyNameType->getValue();
        
        // The class is obtained from the ObjectType
        $className = $objectType->getClassName();
        
        // Check if class exists
        if (!$this->reflectionProvider->hasClass($className)) {
            return []; // Can't verify further if class doesn't exist
        }
        
        $classReflection = $this->reflectionProvider->getClass($className);
        
        // Check if property exists on the class
        if (!$classReflection->hasProperty($propertyName)) {
            $availableProperties = $this->getAvailableProperties($classReflection);
            
            return [
                RuleErrorBuilder::message(
                    sprintf(
                        'Property "%s" does not exist on class "%s". Available properties: %s', 
                        $propertyName, 
                        $classReflection->getDisplayName(),
                        $availableProperties
                    )
                )->build()
            ];
        }

        return [];
    }

    /**
     * Validates calls to getClassProperty(string $className, object $obj, string $propertyName)
     */
    private function validateGetClassProperty(StaticCall $node, Scope $scope): array
    {
        $args = $node->getArgs();
        if (count($args) < 3) {
            return [
                RuleErrorBuilder::message(
                    'Method ReflectionUtil::getClassProperty requires 3 arguments'
                )->build()
            ];
        }

        // Get $className and $propertyName arguments
        $classNameType = $scope->getType($args[0]->value);
        $propertyNameType = $scope->getType($args[2]->value);

        if (!$classNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $className argument of ReflectionUtil::getClassProperty must be a string literal for static analysis'
                )->build()
            ];
        }

        if (!$propertyNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $propertyName argument of ReflectionUtil::getClassProperty must be a string literal for static analysis'
                )->build()
            ];
        }

        $className = $classNameType->getValue();
        $propertyName = $propertyNameType->getValue();

        // Check if class exists
        if (!$this->reflectionProvider->hasClass($className)) {
            return [
                RuleErrorBuilder::message(
                    sprintf('Class "%s" used in ReflectionUtil::getClassProperty was not found', $className)
                )->build()
            ];
        }

        $classReflection = $this->reflectionProvider->getClass($className);

        // Check if property exists
        if (!$classReflection->hasProperty($propertyName)) {
            $availableProperties = $this->getAvailableProperties($classReflection);
            
            return [
                RuleErrorBuilder::message(
                    sprintf(
                        'Property "%s" does not exist on class "%s". Available properties: %s', 
                        $propertyName, 
                        $className,
                        $availableProperties
                    )
                )->build()
            ];
        }

        return [];
    }

    /**
     * Validates calls to setProperty(object $obj, string $propertyName, mixed $value)
     */
    private function validateSetProperty(StaticCall $node, Scope $scope): array
    {
        $args = $node->getArgs();
        if (count($args) < 3) {
            return [
                RuleErrorBuilder::message(
                    'Method ReflectionUtil::setProperty requires 3 arguments'
                )->build()
            ];
        }

        // Get $propertyName argument
        $propertyNameType = $scope->getType($args[1]->value);

        if (!$propertyNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $propertyName argument of ReflectionUtil::setProperty must be a string literal for static analysis'
                )->build()
            ];
        }

        // Check object argument
        $objectType = $scope->getType($args[0]->value);
        if (!$objectType instanceof ObjectType) {
            // We can't determine the object type, so we can't validate the property
            return [];
        }

        $propertyName = $propertyNameType->getValue();
        
        // The class is obtained from the ObjectType
        $className = $objectType->getClassName();
        
        // Check if class exists
        if (!$this->reflectionProvider->hasClass($className)) {
            return []; // Can't verify further if class doesn't exist
        }
        
        $classReflection = $this->reflectionProvider->getClass($className);
        
        // Check if property exists on the class
        if (!$classReflection->hasProperty($propertyName)) {
            $availableProperties = $this->getAvailableProperties($classReflection);
            
            return [
                RuleErrorBuilder::message(
                    sprintf(
                        'Property "%s" does not exist on class "%s". Available properties: %s', 
                        $propertyName, 
                        $classReflection->getDisplayName(),
                        $availableProperties
                    )
                )->build()
            ];
        }

        return [];
    }

    /**
     * Validates calls to setClassProperty(string $className, object $obj, string $propertyName, mixed $value)
     */
    private function validateSetClassProperty(StaticCall $node, Scope $scope): array
    {
        $args = $node->getArgs();
        if (count($args) < 4) {
            return [
                RuleErrorBuilder::message(
                    'Method ReflectionUtil::setClassProperty requires 4 arguments'
                )->build()
            ];
        }

        // Get $className and $propertyName arguments
        $classNameType = $scope->getType($args[0]->value);
        $propertyNameType = $scope->getType($args[2]->value);

        if (!$classNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $className argument of ReflectionUtil::setClassProperty must be a string literal for static analysis'
                )->build()
            ];
        }

        if (!$propertyNameType instanceof ConstantStringType) {
            return [
                RuleErrorBuilder::message(
                    'The $propertyName argument of ReflectionUtil::setClassProperty must be a string literal for static analysis'
                )->build()
            ];
        }

        $className = $classNameType->getValue();
        $propertyName = $propertyNameType->getValue();

        // Check if class exists
        if (!$this->reflectionProvider->hasClass($className)) {
            return [
                RuleErrorBuilder::message(
                    sprintf('Class "%s" used in ReflectionUtil::setClassProperty was not found', $className)
                )->build()
            ];
        }

        $classReflection = $this->reflectionProvider->getClass($className);

        // Check if property exists
        if (!$classReflection->hasProperty($propertyName)) {
            $availableProperties = $this->getAvailableProperties($classReflection);
            
            return [
                RuleErrorBuilder::message(
                    sprintf(
                        'Property "%s" does not exist on class "%s". Available properties: %s', 
                        $propertyName, 
                        $className,
                        $availableProperties
                    )
                )->build()
            ];
        }

        return [];
    }
}