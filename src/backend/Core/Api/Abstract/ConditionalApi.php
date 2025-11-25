<?php

namespace Espo\Modules\Viacrm\Core\Api\Abstract;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Utils\Config;
use Espo\Modules\Viacrm\Classes\Utils\ExtensionUtil;
use Espo\Modules\Viacrm\Classes\Utils\VersionUtil;
use Espo\Modules\Viacrm\Core\Abstract\Traits\ConditionalExtension;

/**
 * Abstract class for API actions that need to be conditionally executed based on installed extensions.
 * 
 * This class provides a framework for creating API endpoints that behave differently depending on
 * which extensions are installed in the system. It follows the same pattern as other conditional
 * components like ConditionalHook and ConditionalAdditionalBuilder.
 * 
 * Usage:
 * 1. Extend this class in your API implementation
 * 2. Define the $requiredExtensions property with the extensions your API depends on
 * 3. Implement the allPresentProcess() method for when all extensions are available
 * 4. Optionally implement process{ExtensionName}() methods for extension-specific logic
 * 
 * @example: class MyConditionalApi extends ConditionalApi
 * {
 *     public array $requiredExtensions = [
 *         'Accounting' => '>=1.0.0',
 *         'WarehouseManagement' => '>=1.0.0'
 *     ];
 * 
 *     protected function allPresentProcess(Request $request): Response
 *     {
 *         // Logic when all extensions are present
 *         return ResponseComposer::json(['success' => true]);
 *     }
 * 
 *     protected function processAccounting(Request $request): Response
 *     {
 *         // Logic specific to Accounting extension
 *         return ResponseComposer::json(['accounting' => true]);
 *     }
 * }
 * 
 * 
 * @see \Espo\Modules\Viacrm\Core\Hook\ConditionalHook\Abstract\ConditionalHook
 * @see \Espo\Modules\Viacrm\Core\Utils\Metadata\AdditionalBuilder\Abstract\ConditionalAdditionalBuilder
 */
abstract class ConditionalApi implements Action {
	use ConditionalExtension;

	protected readonly ExtensionUtil $extensionUtil;
    
	/**
	 * @var array<string, string> Key is module name, value is module version.
	 */
	protected array $installedExtensions;

	public function __construct(
		protected readonly Config $config
	) {
		$this->extensionUtil = ExtensionUtil::fromConfig($this->config);
		$this->installedExtensions = $this->extensionUtil->getInstalledExtensions();
	}

	/**
	 * Process method called when all required extensions are present.
	 * 
	 * This method should contain the main logic of your API endpoint that will be executed
	 * when all the required extensions are installed and meet the version requirements.
	 * 
	 * @param  Request  $request The API request object
	 * @return Response The API response
	 */
	abstract protected function allPresentProcess(Request $request): Response;

	/**
	 * Main process method that checks extensions and delegates to specific handlers.
	 * 
	 * This method:
	 * 1. Checks if all required extensions are installed and meet version requirements
	 * 2. Calls extension-specific process methods if they exist (process{ExtensionName})
	 * 3. Calls allPresentProcess() if all required extensions are available
	 * 4. Returns an appropriate response based on available extensions
	 * 
	 * You should not override this method in most cases. Instead, implement the
	 * allPresentProcess() method and any needed process{ExtensionName}() methods.
	 * 
	 * @param  Request  $request The API request object
	 * @return Response The API response
	 */
	public function process(Request $request): Response {
		$allPresent = true;
		$result = null;

		foreach ($this->requiredExtensions as $extensionName => $requiredVersion) {
			$extensionName = (string)$extensionName;

			if (!isset($this->installedExtensions[$extensionName])) {
				$allPresent = false;
				continue;
			}

			$installedVersion = $this->installedExtensions[$extensionName];

			if (!VersionUtil::satisfiesVersionRequirement($installedVersion, $requiredVersion)) {
				$allPresent = false;
				continue;
			}

			$methodName = "process{$extensionName}";

			if (method_exists($this, $methodName)) {
				$extensionResult = $this->{$methodName}($request);
                
				// Store the result from the first extension that returns a non-null result
				if ($result === null && $extensionResult !== null) {
					$result = $extensionResult;
				}
			}
		}

		if ($allPresent) {
			return $this->allPresentProcess($request);
		}

		// If no extension-specific process method returned a result, return a default response
		if ($result === null) {
			return ResponseComposer::json([
			    'success' => false,
			    'message' => 'Required extensions not installed or version requirements not met'
			]);
		}

		return $result;
	}

}
