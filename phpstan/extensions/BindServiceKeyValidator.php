<?php

namespace ViacrmDev\PHPStan\Extensions;

use PhpParser\Node;
use PhpParser\Node\Expr\MethodCall;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;
use PHPStan\Type\ObjectType;

class BindServiceKeyValidator implements Rule
{
    /** @var array<string, mixed> */
    private $containerServices;

    public function __construct()
    {
        $containerServicesPath = __DIR__ . '/../../src/backend/Resources/metadata/app/containerServices.json';
        
        $containerServicesJson = file_get_contents($containerServicesPath);
        $this->containerServices = json_decode($containerServicesJson, true) ?? [];
    }

    public function getNodeType(): string
    {
        return MethodCall::class;
    }

    /**
     * @param MethodCall $node
     * @param Scope $scope
     * @return array<\PHPStan\Rules\RuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        // Check if the method call is bindService
        if (!$node->name instanceof Node\Identifier || $node->name->toString() !== 'bindService') {
            return [];
        }

        // Check if the calling object is an instance of Binder
        $callerType = $scope->getType($node->var);
        if (!$callerType instanceof ObjectType || !$callerType->isInstanceOf('Espo\Core\Binding\Binder')->yes()) {
            return [];
        }

        // Check if there are exactly 2 arguments (service class and key)
        if (count($node->args) !== 2) {
            return [];
        }

        // Get the key argument (should be the second argument)
        $keyArg = $node->args[1]->value;

        // If key is not a string literal, we can't validate it
        if (!$keyArg instanceof Node\Scalar\String_) {
            return [
                RuleErrorBuilder::message(
                    'The service key in bindService should be a string literal for static analysis'
                )->build()
            ];
        }

        // Get the service key as string
        $serviceKey = $keyArg->value;

        // Check if the key exists in containerServices.json
        if (!array_key_exists($serviceKey, $this->containerServices)) {
            return [
                RuleErrorBuilder::message(
                    sprintf(
                        'Service key "%s" in bindService call does not exist in containerServices.json',
                        $serviceKey
                    )
                )->build()
            ];
        }

        return [];
    }
}