<?php

namespace Espo\Modules\Viacrm\Core\Acl\Table;

use Espo\Core\Acl\FieldData;
use Espo\Core\Binding\BindingContainer;
use Espo\Core\InjectableFactory;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use ReflectionClass;
use stdClass;

class DefaultTable extends \Espo\Core\Acl\Table\DefaultTable
{
	public const ACTION_PRINT = 'print';

	public function __construct(
		InjectableFactory $injectableFactory,
		BindingContainer $bindingContainer
	) {
		$parentConstructorArgs = ReflectionUtil::callMethod($injectableFactory, 'getConstructorInjectionList', new ReflectionClass(parent::class), null, $bindingContainer);

		// Add print to action list so that the level is properly calculated
		ReflectionUtil::redefineClassProperty(parent::class, $this, 'actionList', static fn ($actionList) => [...$actionList, self::ACTION_PRINT]);

		parent::__construct(...$parentConstructorArgs);
	}

	protected function applyDefault(stdClass &$table, stdClass &$fieldTable): void
	{
		foreach (get_object_vars($table) as $scope => $scopeData) {
			if (($table->$scope instanceof stdClass) && isset($table->$scope->{self::ACTION_READ}) && !isset($table->$scope->{self::ACTION_PRINT})) {
				// Init not-set print permissions to the same level as read, if set
				$table->$scope->{self::ACTION_PRINT} = $table->$scope->{self::ACTION_READ};
			}
		}

		parent::applyDefault($table, $fieldTable);
	}

	public function getFieldData(string $scope, string $field): FieldData
	{
		$fieldType = $this->metadata->get(['entityDefs', $scope, 'fields', $field, 'type'], null);

		return match ($fieldType) {
			default => parent::getFieldData($scope, $field),
		};
	}
}
