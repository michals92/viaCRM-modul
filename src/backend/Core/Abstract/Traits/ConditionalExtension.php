<?php

namespace Espo\Modules\Viacrm\Core\Abstract\Traits;

/**
 * @phpstan-type ExtensionKey = 'WarehouseManagement'|'Accounting'|'Production'|'Viacrm'|'ProjectManagement'|'AssetManagement'|'Approval'|'ContractManagement'|'ServiceManagement'|'AiParsing'|'Banking'
 */
trait ConditionalExtension {
	/**
	 * Keys should be one of the values defined in {@see \Espo\Modules\Viacrm\Classes\Utils\Common\Extension}.
	 *
	 * @var array<ExtensionKey, string> Key is module name, value is module version.
	 */
	public array $requiredExtensions;
}
