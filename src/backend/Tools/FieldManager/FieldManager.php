<?php

namespace Espo\Modules\Autocrm\Tools\FieldManager;

use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use Espo\Tools\FieldManager\FieldManager as FieldManagerTool;

class FieldManager extends FieldManagerTool {

	/**
	 * @param  array<string,mixed> $fieldDefs
	 * @return array<string,mixed>
	 */
	protected function prepareFieldDefs(string $scope, string $name, array $fieldDefs): array {
		// The method has been made private
		$filteredDefs = ReflectionUtil::callClassMethod(FieldManagerTool::class, $this, 'prepareFieldDefs', $scope, $name, $fieldDefs);

		if (isset($fieldDefs['notStorable']) && $fieldDefs['notStorable']) {
			$filteredDefs['notStorable'] = true;
		}

		return $filteredDefs;
	}

}
