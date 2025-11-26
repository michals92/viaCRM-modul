<?php

namespace Espo\Modules\Viacrm\ORM\QueryComposer;

/**
 * Extended MySQL query composer that adds support for expressions in insert queries.
 */
class MysqlQueryComposer extends \Espo\ORM\QueryComposer\MysqlQueryComposer {
	use QueryComposerExtensionTrait;

	// Allows use of Expressions in updateSet
	protected function createInsertQuery(?array $params): string {
		$params = $this->normalizeInsertParams($params ?? []);

		$entityType = $params['into'];

		$columns = $params['columns'];
		$updateSet = $params['updateSet'];

		$columnsPart = $this->getInsertColumnsPart($columns);

		$valuesPart = $this->getInsertValuesPart($entityType, $params);

		$updatePart = null;

		if ($updateSet) {
			$updatePart = $this->getInsertUpdatePartExtended($entityType, $updateSet);
		}

		return $this->composeInsertQuery($this->toDb($entityType), $columnsPart, $valuesPart, $updatePart);
	}
}
