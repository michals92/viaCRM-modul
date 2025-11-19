<?php

namespace Espo\Modules\Autocrm\Core\Workflow\Actions;

use Espo\Core\Container;
use Espo\Core\ORM\Entity as CoreEntity;
use Espo\Core\Record\ServiceContainer;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Entity;
use ReflectionClass;
use RuntimeException;
use stdClass;

@include_once ('custom/Espo/Modules/Advanced/Core/Workflow/Actions/BaseEntity.php');

/** @disregard */
ReflectionUtil::createClassIfNotExists(
	\Espo\Modules\Advanced\Core\Workflow\Actions\BaseEntity::class,
	<<<'PHP'
    namespace Espo\Modules\Advanced\Core\Workflow\Actions;
    
    class BaseEntity {}
    PHP
);

/** @disregard */
class DuplicateEntity extends \Espo\Modules\Advanced\Core\Workflow\Actions\BaseEntity {

	private FormulaManager $formulaManagerExt;

	public function __construct(
		Container $container
	) {
		$parentConstructorArgs = ReflectionUtil::callMethod($container->get('injectableFactory'), 'getConstructorInjectionList', new ReflectionClass(parent::class));

		parent::__construct(...$parentConstructorArgs);

		/** @var FormulaManager $formulaManager */
		$formulaManager = $container->get('formulaManager');

		$this->formulaManagerExt = $formulaManager;
	}

	/**
	 * Union type for cross-version compatibility with Advanced Pack.
	 * Old versions use Entity (Espo\ORM\Entity), new versions use CoreEntity (Espo\Core\ORM\Entity).
	 *
	 * @param array<string, mixed> $options
	 */
	protected function run(CoreEntity|Entity $entity, stdClass $actionData, array $options = []): bool {
		/** @var ServiceContainer $serviceContainer */
		$serviceContainer = $this->getContainer()->get('recordServiceContainer');

		$duplicateAttributes = $serviceContainer->get($entity->getEntityType())->getDuplicateAttributes($entity->getId());

		$entityManager = $this->getEntityManager();

		$newEntity = $entityManager->getNewEntity($entity->getEntityType());

		$newEntity->set($duplicateAttributes);

		$reloadedEntity = $entityManager->getEntityById($entity->getEntityType(), $entity->getId()) ?? throw new RuntimeException();

		$data = $this->getDataToFill($reloadedEntity, $actionData->fields);

		$reloadedEntity->set($data);
		$newEntity->set($data);

		if (!empty($actionData->formula)) {
			$this->formulaManagerExt->run($actionData->formula, $reloadedEntity, $this->getFormulaVariables());

			$clonedVariables = clone $this->getFormulaVariables();

			$this->formulaManagerExt->run($actionData->formula, $newEntity, $clonedVariables);
		}

		$entityManager->saveEntity($newEntity, [
		    'modifiedById' => 'system',
		    'skipWorkflow' => !$this->bpmnProcess,
		    'workflowId' => $this->getWorkflowId(),
		]);

		return true;
	}

}
