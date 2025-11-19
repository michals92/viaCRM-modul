<?php

namespace Espo\Modules\Autocrm\Core\ORM\QueryComposer\Part\FunctionConverters\Mysql;

use Espo\ORM\QueryComposer\Part\FunctionConverter;

class JsonObjectField implements FunctionConverter {

	public function convert(string ...$argumentList): string {
		if (count($argumentList) !== 2) {
			throw new \RuntimeException('JSON_OBJECT_FIELD function requires exactly 2 arguments: json_column and field_name');
		}

		[$jsonColumn, $fieldName] = $argumentList;

		// MariaDB syntax: column->>'$.field'
		// Using ->> operator which is shorthand for JSON_UNQUOTE(JSON_EXTRACT(...))
		return "({$jsonColumn}->>CONCAT('$.', {$fieldName}))";
	}

}
