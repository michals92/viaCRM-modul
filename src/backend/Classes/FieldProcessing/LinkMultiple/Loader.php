<?php

namespace Espo\Modules\Autocrm\Classes\FieldProcessing\LinkMultiple;

use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\FieldProcessing\Loader as FieldLoader;
use Espo\Core\FieldProcessing\Loader\Params as LoaderParams;
use Espo\Modules\Autocrm\Tools\ColumnList\Loader as ColumnListLoader;
use Espo\Modules\Autocrm\Tools\RecordList\Loader as RecordListLoader;
use Espo\ORM\Defs as OrmDefs;
use Espo\ORM\Entity;

/**
 * @implements FieldLoader<Entity>
 */
class Loader implements FieldLoader {

	/**
	 * @var array<string,array{recordList: string[], columnList: string[]}>
	 */
	private array $fieldListCacheMap = [];

	public function __construct(
		private readonly OrmDefs $ormDefs,
		private readonly RecordListLoader $recordListLoader,
		private readonly ColumnListLoader $columnListLoader
	) {}

	/**
	 * @throws Forbidden
	 * @throws NotFound
	 */
	public function process(Entity $entity, LoaderParams $params): void {
		$entityType = $entity->getEntityType();
		$fieldLists = $this->getFieldLists($entityType);

		if (!empty($fieldLists['recordList'])) {
			foreach ($fieldLists['recordList'] as $field) {
				try {
					$this->recordListLoader->load($entity, $field);
				} catch (\Exception $ex) {
					$GLOBALS['log']->error($ex->getMessage().' '.$ex->getTraceAsString());
				}
			}
		}

		if (!empty($fieldLists['columnList'])) {
			foreach ($fieldLists['columnList'] as $field) {
				try {
					$this->columnListLoader->load($entity, $field);
				} catch (\Exception $ex) {
					$GLOBALS['log']->error($ex->getMessage().' '.$ex->getTraceAsString());
				}
			}
		}
	}

	/**
	 * @return array{recordList: string[], columnList: string[]}
	 */
	private function getFieldLists(string $entityType): array {
		if (array_key_exists($entityType, $this->fieldListCacheMap)) {
			return $this->fieldListCacheMap[$entityType];
		}

		$lists = [
		    'recordList' => [],
		    'columnList' => []
		];

		$entityDefs = $this->ormDefs->getEntity($entityType);

		foreach ($entityDefs->getFieldList() as $fieldDefs) {
			if ($fieldDefs->getType() !== 'linkMultiple') {
				continue;
			}

			if ($fieldDefs->getParam('noLoad')) {
				continue;
			}

			if ($fieldDefs->isNotStorable()) {
				continue;
			}

			$name = $fieldDefs->getName();

			if (!$entityDefs->hasRelation($name)) {
				continue;
			}

			if ($fieldDefs->getParam('recordListEnabled')) {
				$lists['recordList'][] = $name;
			}

			if ($fieldDefs->getParam('columnListEnabled')) {
				$lists['columnList'][] = $name;
			}
		}

		$this->fieldListCacheMap[$entityType] = $lists;

		return $lists;
	}

}
