<?php

namespace Tests\Unit\Metadata;

use Espo\Core\Api\Action;

/**
 * Tests for routes.json action classes
 */
class RoutesActionTest extends AbstractMetadataTest {

	/**
	 * Test that all route action classes implement the Action interface and follow namespace conventions
	 */
	public function testRouteActionsImplementInterface(): void {
		// Load the routes.json file manually since it's not in the standard metadata folders
		$routesPath = __DIR__ . '/../../../src/backend/Resources/routes.json';
		$this->assertFileExists($routesPath, 'routes.json file not found');
        
		$routesJson = file_get_contents($routesPath);
		$this->assertNotFalse($routesJson, 'Failed to read routes.json');
        
		$routes = json_decode($routesJson, true);
		$this->assertNotNull($routes, 'Failed to parse routes.json');
		$this->assertIsArray($routes, 'routes.json content should be an array');
        
		$classesWithIssues = [];
		$actionClassCount = 0;
        
		foreach ($routes as $index => $route) {
			$this->assertIsArray(
				$route,
				"Route at index $index must be an array"
			);
            
			$this->assertArrayHasKey(
				'route',
				$route,
				"Route at index $index is missing 'route' property"
			);
            
			$this->assertArrayHasKey(
				'method',
				$route,
				"Route at index $index is missing 'method' property"
			);
            
			// Only test routes with actionClassName
			if (!isset($route['actionClassName'])) {
				continue;
			}
            
			$actionClassCount++;
			$actionClass = $route['actionClassName'];
			$routePath = $route['route'];
            
			$this->assertIsString(
				$actionClass,
				"actionClassName for route '$routePath' must be a string"
			);
            
			// Check if the class exists
			try {
				$exists = class_exists($actionClass);
				$this->assertTrue(
					$exists,
					"Action class '$actionClass' for route '$routePath' does not exist"
				);
                
				if ($exists) {
					// Check if the class implements the Action interface
					$reflection = new \ReflectionClass($actionClass);
					$implementsInterface = $reflection->implementsInterface(Action::class);
                    
					// Note: This will collect classes that don't implement the interface
					// but the test will still pass to match the requirement
					if (!$implementsInterface) {
						$classesWithIssues[] = [
						    'class' => $actionClass, 
						    'route' => $routePath,
						    'issue' => 'Does not implement ' . Action::class
						];
					}
                    
					// Check namespace pattern
					$correctNamespace = str_starts_with($actionClass, 'Espo\\Modules\\Autocrm\\Api\\');
					if (!$correctNamespace) {
						$classesWithIssues[] = [
						    'class' => $actionClass, 
						    'route' => $routePath,
						    'issue' => 'Not in Espo\\Modules\\Autocrm\\Api namespace'
						];
					}
				}
			} catch (\Exception $e) {
				$classesWithIssues[] = [
				    'class' => $actionClass, 
				    'route' => $routePath,
				    'issue' => 'Exception: ' . $e->getMessage()
				];
			}
		}
        
		// Make sure there's at least one action class defined
		$this->assertGreaterThan(
			0,
			$actionClassCount,
			'There should be at least one route with actionClassName defined'
		);
        
		// Now we want to fail the test if there are any issues
		if (count($classesWithIssues) > 0) {
			$formattedIssues = "The following classes have issues:\n";
			foreach ($classesWithIssues as $issueInfo) {
				$formattedIssues .= "- {$issueInfo['class']} (route: {$issueInfo['route']}): {$issueInfo['issue']}\n";
			}
            
			$this->fail($formattedIssues);
		}
	}
    
	/**
	 * Test that at least one route action class has the correct namespace and implements interface
	 */
	public function testAtLeastOneValidRouteAction(): void {
		$routesPath = __DIR__ . '/../../../src/backend/Resources/routes.json';
		$routesJson = file_get_contents($routesPath);
		$routes = json_decode($routesJson, true);
        
		$validActionFound = false;
        
		foreach ($routes as $route) {
			// Skip routes without actionClassName
			if (!isset($route['actionClassName'])) {
				continue;
			}
            
			$actionClass = $route['actionClassName'];
            
			if (class_exists($actionClass)) {
				$reflection = new \ReflectionClass($actionClass);
                
				if ($reflection->implementsInterface(Action::class) &&
				    str_starts_with($actionClass, 'Espo\\Modules\\Autocrm\\Api\\')) {
					$validActionFound = true;
					break;
				}
			}
		}
        
		$this->assertTrue(
			$validActionFound,
			'At least one route action class should implement ' . Action::class . 
			' and be in the Espo\\Modules\\Autocrm\\Api namespace'
		);
	}
    
	/**
	 * Test route structure
	 */
	public function testRouteStructure(): void {
		$routesPath = __DIR__ . '/../../../src/backend/Resources/routes.json';
		$routesJson = file_get_contents($routesPath);
		$routes = json_decode($routesJson, true);
        
		foreach ($routes as $index => $route) {
			$this->assertIsArray(
				$route,
				"Route at index $index must be an array"
			);
            
			$this->assertArrayHasKey(
				'route',
				$route,
				"Route at index $index is missing 'route' property"
			);
            
			$this->assertIsString(
				$route['route'],
				"Route path at index $index must be a string"
			);
            
			$this->assertArrayHasKey(
				'method',
				$route,
				"Route at index $index is missing 'method' property"
			);
            
			$this->assertIsString(
				$route['method'],
				"HTTP method at index $index must be a string"
			);
            
			$this->assertContains(
				strtolower($route['method']),
				['get', 'post', 'put', 'patch', 'delete'],
				"HTTP method '{$route['method']}' at index $index must be one of: GET, POST, PUT, PATCH, DELETE"
			);
            
			// Check that route has either actionClassName or params.controller/action
			$hasActionClass = isset($route['actionClassName']);
			$hasControllerAction = isset($route['params']) && 
			    isset($route['params']['controller']) && 
			    isset($route['params']['action']);
            
			$this->assertTrue(
				$hasActionClass || $hasControllerAction,
				"Route at index $index must have either 'actionClassName' or 'params' with 'controller' and 'action'"
			);
		}
	}

}