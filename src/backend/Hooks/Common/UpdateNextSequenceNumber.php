<?php

namespace Espo\Modules\Viacrm\Hooks\Common;

use Espo\Core\Field\Date;
use Espo\Core\Hook\Hook\BeforeSave;
use Espo\Core\ORM\Repository\Option\SaveOption;
use Espo\Core\Utils\DateTime;
use Espo\Modules\Viacrm\Entities\NextSequenceNumber;
use Espo\ORM\Defs\FieldDefs;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Repository\Option\SaveOptions;

/**
 * @implements BeforeSave<Entity>
 */
class UpdateNextSequenceNumber implements BeforeSave {

	/**
	 * @var array<string,FieldDefs[]>
	 */
	private array $fieldListMapCache = [];

	public function __construct(
		private readonly EntityManager $entityManager
	) {}

	public function beforeSave(Entity $entity, SaveOptions $options): void {
		$fieldList = $this->getFieldList($entity->getEntityType());
		$optionsArray = $options->toAssoc();

		foreach ($fieldList as $field) {
			$this->processItem($entity, $field, $optionsArray);
		}
	}

	/**
	 * @param array<string,mixed> $options
	 */
	private function processItem(Entity $entity, FieldDefs $defs, array $options): void {
		$field = $defs->getName();
		$allowCustomValue = $defs->getParam('allowCustomValue') ?? false;

		// If custom value is allowed and used, skip sequence number generation
		if ($allowCustomValue && $entity->get($field . 'IsCustomValue') === true) {
			return;
		}

		if (
			!empty($options[SaveOption::IMPORT]) &&
			$entity->has($field)
		) {
			return;
		}

		if (!$entity->isNew()) {
			if ($entity->isAttributeChanged($field)) {
				$entity->set($field, $entity->getFetched($field));
			}

			return;
		}

		if (str_ends_with($field, 'A')) {
			$fieldWithoutA = substr($field, 0, -1);
			if ($entity->has($fieldWithoutA) && $entity->get($fieldWithoutA)) {
				$entity->set($field, $entity->get($fieldWithoutA));

				return;
			}
		}

		$this->entityManager->getTransactionManager()->start();

		/** @var NextSequenceNumber|null $nextNumber */
		$nextNumber = $this->entityManager
		    ->getRDBRepository(NextSequenceNumber::ENTITY_TYPE)
		    ->where([
		        'fieldName' => $field,
		        'entityType' => $entity->getEntityType(),
		    ])
		    ->forUpdate()
		    ->findOne();

		if ($nextNumber === null) {
			/** @var NextSequenceNumber $nextNumber */
			$nextNumber = $this->entityManager->getNewEntity(NextSequenceNumber::ENTITY_TYPE);

			$nextNumber->set([
			    'entityType' => $entity->getEntityType(),
			    'fieldName' => $field,
			    'date' => DateTime::getSystemTodayString(),
			]);
		}

		$format = $defs->getParam('format') ?? '{YYYY}-{number}';
		$padLength = $defs->getParam('padLength') ?? 5;
		$reset = $defs->getParam('reset') ?? 'Yearly';

		$numberValue = $nextNumber->getNumberValue();
		$date = $nextNumber->getDate();

		$dateNow = Date::createToday();

		$resetMap = [];
		$resetMap[NextSequenceNumber::RESET_YEARLY] = $date->getYear() !== $dateNow->getYear();
		$resetMap[NextSequenceNumber::RESET_MONTHLY] = $resetMap[NextSequenceNumber::RESET_YEARLY] || $date->getMonth() !== $dateNow->getMonth();
		$resetMap[NextSequenceNumber::RESET_DAILY] = $resetMap[NextSequenceNumber::RESET_MONTHLY] || $date->getDay() !== $dateNow->getDay();
		$resetMap[NextSequenceNumber::RESET_NEVER] = false;

		if ($reset && $resetMap[$reset]) {
			$numberValue = 1;
		}

		$replaces = [
		    'YYYY' => date('Y'),
		    'YY' => date('y'),
		    'MM' => date('m'),
		    'DD' => date('d'),
		    'number' => str_pad((string)$numberValue, $padLength, '0', STR_PAD_LEFT),
		];

		$composedNumber = $format;

		foreach ($replaces as $key => $value) {
			$composedNumber = str_replace("{{$key}}", $value, $composedNumber);
		}

		$entity->set($field, $composedNumber);

		$nextNumber->setNumberValue($numberValue + 1);
		$nextNumber->setDate($dateNow);

		$this->entityManager->saveEntity($nextNumber);

		$this->entityManager->getTransactionManager()->commit();
	}

	/**
	 * @return FieldDefs[]
	 */
	private function getFieldList(string $entityType): array {
		if (array_key_exists($entityType, $this->fieldListMapCache)) {
			return $this->fieldListMapCache[$entityType];
		}

		$entityDefs = $this->entityManager
		    ->getDefs()
		    ->getEntity($entityType);

		$list = [];

		foreach ($entityDefs->getFieldList() as $field) {
			if ($field->getType() !== 'sequenceNumber') {
				continue;
			}

			$list[] = $field;
		}

		$this->fieldListMapCache[$entityType] = $list;

		return $list;
	}

}
