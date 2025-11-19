<?php

namespace Espo\Modules\Autocrm\Core\Workflow\Actions;

use Espo\Core\Container;
use Espo\Core\Exceptions\Error;
use Espo\Core\Formula\Exceptions\Error as FormulaError;
use Espo\Core\Formula\Manager as FormulaManager;
use Espo\Core\ORM\Entity as CoreEntity;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Entity;
use LogicException;
use ReflectionClass;
use stdClass;

@include_once ('custom/Espo/Modules/Advanced/Core/Workflow/Actions/UpdateEntity.php');

/** @disregard */
ReflectionUtil::createClassIfNotExists(
	\Espo\Modules\Advanced\Core\Workflow\Actions\UpdateEntity::class,
	<<<'PHP'
    namespace Espo\Modules\Advanced\Core\Workflow\Actions;
    
    class UpdateEntity {}
    PHP
);

/** @disregard */
class UpdateEntity extends \Espo\Modules\Advanced\Core\Workflow\Actions\UpdateEntity {

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
	 *
	 * @throws FormulaError
	 * @throws Error
	 */
	protected function run(CoreEntity|Entity $entity, stdClass $actionData, array $options = []): bool {
		$reloadedEntity = $this->entityManager->getEntityById($entity->getEntityType(), $entity->getId()) ?? throw new LogicException('Entity not found.');

		$data = $this->getDataToFill($reloadedEntity, $actionData->fields);

		$reloadedEntity->set($data);
		$entity->set($data);

		$formula = $actionData->formula ?? null;

		if ($formula) {
			$this->formulaManagerExt->run($formula, $reloadedEntity, $this->getFormulaVariables());
		}

		foreach ($reloadedEntity->getAttributeList() as $attribute) {
			if ($reloadedEntity->isAttributeChanged($attribute)) {
				$entity->set($attribute, $reloadedEntity->get($attribute));
			}
		}

		$saveOptions = [
			'modifiedById' => 'system',
			'skipWorkflow' => !$this->bpmnProcess,
			'workflowId' => $this->getWorkflowId(),
		];

		if ($actionData->skipHooks ?? false) {
			$saveOptions['skipHooks'] = true;
		}

		$this->entityManager->saveEntity($reloadedEntity, $saveOptions);

		return true;
	}

}
