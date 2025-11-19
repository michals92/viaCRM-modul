<?php

namespace Espo\Modules\Autocrm\Core\ORM\QueryComposer\Part\FunctionConverters\Postgresql;

use Espo\ORM\QueryComposer\Part\FunctionConverter;

class ForeignField implements FunctionConverter {

	public function convert(string ...$argumentList): string {
		if (count($argumentList) < 3) {
			throw new \RuntimeException(
				'FOREIGN_FIELD: Wrong number of arguments. ' .
				'Usage: FOREIGN_FIELD(entityType, entityId, fieldName)'
			);
		}

		$entityType = $this->toLowerCase(trim($argumentList[0], "'"));  // Remove quotes and convert to lowercase
		$entityIdRef = trim($argumentList[1], "'"); // Get the entity reference without quotes
		$fieldName = $this->toLowerCase(trim($argumentList[2], "'"));   // Remove quotes and convert to lowercase

		$alias = 'linkedEntity' . str_replace('.', '', uniqid('', true));

		// Extract parts and construct the reference correctly
		$entityIdParts = explode('.', $entityIdRef);
		$tableName = $entityIdParts[0];
		$columnName = $entityIdParts[1] ?? 'id';

		$idReference = $tableName. '.' . $columnName;

		return 'COALESCE((
			SELECT "' . $alias . '"."' . $fieldName . '"
			FROM "' . $entityType . '" AS "' . $alias . '"
			WHERE "' . $alias . '"."id" = ' . $idReference . '
			AND "' . $alias . '"."deleted" = FALSE
			LIMIT 1
		), NULL)';
	}

	private function toLowerCase(string $string): string {
		return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $string) ?? $string);
	}

}
