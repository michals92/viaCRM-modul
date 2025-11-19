<?php

namespace Espo\Modules\Autocrm\Core\ORM\QueryComposer\Part\FunctionConverters\Mysql;

use Espo\ORM\QueryComposer\Part\FunctionConverter;

class ForeignField implements FunctionConverter {

	public function convert(string ...$argumentList): string {
		if (count($argumentList) < 3) {
			throw new \RuntimeException(
				'FOREIGN_FIELD: Wrong number of arguments. ' .
				'Usage: FOREIGN_FIELD(entityType, entityId, fieldName)'
			);
		}

		$entityType = trim($argumentList[0], "'");  // Remove quotes
		$entityIdParts = explode('.', trim($argumentList[1], "'")); // Split the entity reference
		$fieldName = trim($argumentList[2], "'");   // Remove quotes

		$alias = 'linkedEntity' . str_replace('.', '', uniqid('', true));

		// Properly reference the ID column
		$idReference = "`{$entityIdParts[0]}`.`{$entityIdParts[1]}`";

		return "COALESCE((
            SELECT `{$alias}`.`{$fieldName}`
            FROM `{$entityType}` AS `{$alias}`
            WHERE `{$alias}`.`id` = {$idReference}
            AND `{$alias}`.`deleted` = FALSE
            LIMIT 1
        ), NULL)";
	}

}
