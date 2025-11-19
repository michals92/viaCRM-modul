<?php

namespace Espo\Modules\Autocrm\Core\ORM\QueryComposer\Part\FunctionConverters\Postgresql;

use Espo\ORM\QueryComposer\Part\FunctionConverter;

class JsonObjectField implements FunctionConverter {

	public function convert(string ...$argumentList): string {
		if (count($argumentList) !== 2) {
			throw new \RuntimeException('JSON_OBJECT_FIELD function requires exactly 2 arguments: json_column and field_name');
		}

		[$jsonColumn, $fieldName] = $argumentList;

		// PostgreSQL syntax: column->>'field'
		// The field name comes as a quoted string, we use it directly
		return "({$jsonColumn}::jsonb->>{$fieldName})";
	}

}
