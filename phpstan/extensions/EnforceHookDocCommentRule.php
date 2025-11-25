<?php

declare(strict_types=1);

namespace ViacrmDev\PHPStan\Extensions;

use PhpParser\Node;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;
use PHPStan\Reflection\ReflectionProvider;
use Espo\Core\Utils\Util; // For normalizeClassName

/**
 * @implements Rule<Node\Stmt\Class_>
 */
class EnforceHookDocCommentRule implements Rule
{
    // Updated pattern to capture the first subdirectory (Common or EntityType)
    private const HOOK_PATH_PATTERN = '#^src/backend/Hooks/([^/]+)/.+\.php$#';
    private const COMMON_HOOK_DIR = 'Common';
    private const EXPECTED_COMMON_ENTITY_FQCN = \Espo\Orm\Entity::class;

    private const ALLOWED_HOOK_INTERFACES = [
        'BeforeSave',
        'AfterSave',
        'BeforeRemove',
        'AfterRemove',
        'AfterRelate',
        'AfterUnrelate',
        'AfterMassRelate',
    ];

    // Adapted from EntityManagerReturnType
    private array $entityNamespaceList = [
        // AutoCRM modules
        '\\Espo\\Modules\\Autocrm\\Entities',
        '\\Espo\\Modules\\WarehouseManagement\\Entities',
        '\\Espo\\Modules\\ProductBase\\Entities',
        '\\Espo\\Modules\\Accounting\\Entities',
        '\\Espo\\Modules\\Production\\Entities',
        // EspoCRM core modules
        '\\Espo\\Modules\\Advanced\\Entities',
        '\\Espo\\Modules\\Crm\\Entities',
        '\\Espo\\Entities',
    ];

    private ReflectionProvider $reflectionProvider;

    public function __construct(ReflectionProvider $reflectionProvider)
    {
        $this->reflectionProvider = $reflectionProvider;
    }

    public function getNodeType(): string
    {
        return Node\Stmt\Class_::class;
    }

    // Helper function adapted from EntityManagerReturnType
    private function findEntityClassName(string $entityType): ?string
    {
        $normalizedEntityType = Util::normalizeClassName($entityType);
        foreach ($this->entityNamespaceList as $namespace) {
            $className = $namespace . '\\' . $normalizedEntityType;
            if ($this->reflectionProvider->hasClass($className)) {
                return $className;
            }
        }
        // Fallback for entities that might be in the global namespace or a non-standard one
        // This part might need adjustment based on your project structure if entities are outside the listed namespaces
        if ($this->reflectionProvider->hasClass($normalizedEntityType)) {
            return $normalizedEntityType;
        }
        if ($this->reflectionProvider->hasClass('\\' . $normalizedEntityType)) {
             return '\\' . $normalizedEntityType;
        }

        return null;
    }

    /**
     * @param Node\Stmt\Class_ $node
     * @param Scope $scope
     * @return \PHPStan\Rules\RuleError[]
     */
    public function processNode(Node $node, Scope $scope): array
    {
        $filePath = $scope->getFile();
        if (!preg_match(self::HOOK_PATH_PATTERN, $filePath, $pathMatches)) {
            return []; // Not a hook file in the expected subdirectory structure
        }

        $hookSubDir = $pathMatches[1]; // 'Common' or an 'EntityType' like 'XmlFeed'

        $docCommentNode = $node->getDocComment();
        $classNameNode = $node->namespacedName;
        $classNameString = $classNameNode ? $classNameNode->toString() : ($node->name ? $node->name->toString() : 'AnonymousClass');

        if ($docCommentNode === null) {
            return [
                RuleErrorBuilder::message(
                    sprintf('Class %s in a hook path must have a doc comment with an @implements tag for a valid hook interface.', $classNameString)
                )->line($node->getStartLine())->build(),
            ];
        }

        $docCommentText = $docCommentNode->getText();
        $foundMatchingHookImplementation = false;
        $collectedErrors = [];

        foreach (self::ALLOWED_HOOK_INTERFACES as $interface) {
            // Regex to match "@implements InterfaceName<GenericTypeString>"
            // GenericTypeString can contain backslashes for FQCNs.
            $pattern = '/@implements\s+' . preg_quote($interface, '/') . '\s*<\s*([^>]+)\s*>/';
            if (preg_match($pattern, $docCommentText, $genericMatches)) {
                $genericTypeString = trim($genericMatches[1]);

                if (empty($genericTypeString)) {
                    $collectedErrors[] = RuleErrorBuilder::message(
                        sprintf('Class %s: @implements %s tag has an empty generic type.', $classNameString, $interface)
                    )->line($docCommentNode->getStartLine())->build();
                    continue; // Check next interface or fail
                }

                $expectedEntityFqcn = null;
                $errorContextMessage = '';

                if ($hookSubDir === self::COMMON_HOOK_DIR) {
                    $expectedEntityFqcn = self::EXPECTED_COMMON_ENTITY_FQCN;
                    $errorContextMessage = sprintf('Hooks in "%s" directory must use <%s> or a subclass as the generic type for @implements %s.', self::COMMON_HOOK_DIR, self::EXPECTED_COMMON_ENTITY_FQCN, $interface);
                } else {
                    $entityTypeFromPath = $hookSubDir;
                    $expectedEntityFqcn = $this->findEntityClassName($entityTypeFromPath);

                    if ($expectedEntityFqcn === null) {
                        $collectedErrors[] = RuleErrorBuilder::message(
                            sprintf('Class %s: Could not determine the FQCN for entity type "%s" based on hook path. Ensure it exists in configured namespaces.', $classNameString, $entityTypeFromPath)
                        )->line($node->getStartLine())->build();
                        continue; // Cannot validate further for this interface
                    }
                    $errorContextMessage = sprintf('Hooks for entity type "%s" must use <%s> or a subclass as the generic type for @implements %s.', $entityTypeFromPath, $expectedEntityFqcn, $interface);
                }

                // Resolve the generic type string from the doc comment using the current scope
                try {
                    $resolvedGenericNameNode = new \PhpParser\Node\Name($genericTypeString);
                    $resolvedGenericFqcn = $scope->resolveName($resolvedGenericNameNode);
                } catch (\Exception $e) { // Catch potential errors if $genericTypeString is not a valid class name format
                     $collectedErrors[] = RuleErrorBuilder::message(
                        sprintf('Class %s: Generic type "%s" in @implements %s<...> is not a valid class name. %s', $classNameString, $genericTypeString, $interface, $errorContextMessage)
                    )->line($docCommentNode->getStartLine())->build();
                    continue;
                }


                if (!$this->reflectionProvider->hasClass($resolvedGenericFqcn)) {
                    $collectedErrors[] = RuleErrorBuilder::message(
                        sprintf('Class %s: Generic type "%s" (parsed as "%s") in @implements %s<...> does not resolve to an existing class. %s', $classNameString, $genericTypeString, $resolvedGenericFqcn, $interface, $errorContextMessage)
                    )->line($docCommentNode->getStartLine())->build();
                    continue;
                }

                $genericClassReflection = $this->reflectionProvider->getClass($resolvedGenericFqcn);

                if ($genericClassReflection->getName() === $expectedEntityFqcn || $genericClassReflection->isSubclassOf($expectedEntityFqcn)) {
                    $foundMatchingHookImplementation = true;
                    $collectedErrors = []; // Valid implementation found, clear any previous errors for this node
                    break; // Exit foreach ALLOWED_HOOK_INTERFACES
                } else {
                    $collectedErrors[] = RuleErrorBuilder::message(
                        sprintf('Class %s: Generic type "%s" (resolves to "%s") in @implements %s<...> is not assignable to expected type "%s". %s', $classNameString, $genericTypeString, $resolvedGenericFqcn, $interface, $expectedEntityFqcn, $errorContextMessage)
                    )->line($docCommentNode->getStartLine())->build();
                }
            }
        }

        if (!$foundMatchingHookImplementation && empty($collectedErrors)) {
            // This case means no @implements tag for ANY of the allowed interfaces was found.
            $expectedInterfacesList = implode(', ', self::ALLOWED_HOOK_INTERFACES);
            $collectedErrors[] = RuleErrorBuilder::message(
                sprintf(
                    'Class %s doc comment must contain an @implements tag for one of the allowed hook interfaces (%s) with a correctly typed generic argument. Doc comment: "%s"',
                    $classNameString,
                    $expectedInterfacesList,
                    $docCommentText
                )
            )->line($docCommentNode->getStartLine())->build();
        }
        return $collectedErrors;
    }
}