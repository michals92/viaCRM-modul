<?php

namespace Espo\Modules\Viacrm\Services\Traits;

use Espo\Core\Exceptions\Conflict;
use Espo\Core\Exceptions\Error;
use Espo\ORM\Entity;

trait LockedTrait {
	/**
	 * @return string[]
	 */
	abstract protected function getLockedAttributes(): array;

	/**
	 * @return string[]
	 */
	abstract protected function getLockedStates(): array;

	protected function getCancelState(): string {
		return 'Canceled';
	}

	/**
	 * @param Entity $entity
	 * @param object $data
	 *
	 * @throws Conflict
	 * @return void
	 */
	protected function beforeUpdateEntity(Entity $entity, $data): void {
		$this->lockEntity(entity: $entity);
	}

	protected function shouldEnforceLocking(Entity $entity): bool {
		// Get entity-specific locking setting name (e.g., "enforcePurchaseOrderLocking")
		$settingName = 'enforce' . $this->entityType . 'Locking';

		return $this->config->get($settingName, true);
	}
	
	private function lockEntity(Entity $entity): void {
		$reasonPrefix = lcfirst(string: $this->entityType);
		
		if (!$this->shouldEnforceLocking($entity)) {
			return;
		}

		if (in_array(needle: $entity->getFetched(attribute: 'status'), haystack: $this->getLockedStates(), strict: true)) {
			foreach ($this->getLockedAttributes() as $attribute) {
				if ($entity->isAttributeChanged(name: $attribute)) {
					throw Conflict::createWithBody(
						reason: $reasonPrefix . 'Locked',
						body: Error\Body::create()
							->withMessageTranslation(label: $reasonPrefix . 'Locked', scope: $this->entityType, data: [
								'attribute' => $attribute,
							])
							->encode()
					);
				}
			}
		}

		if ($entity->getFetched(attribute: 'status') === $this->getCancelState() && $entity->isAttributeChanged(name: 'status')) {
			throw Conflict::createWithBody(
				reason: $reasonPrefix . 'Canceled',
				body: Error\Body::create()
					->withMessageTranslation(label: $reasonPrefix . 'Canceled', scope: $this->entityType)
					->encode()
			);
		}
	}

	public function process(Entity $entity): void {
		$this->lockEntity(entity: $entity);
	}
}