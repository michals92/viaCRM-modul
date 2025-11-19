<?php

namespace Tests\Unit\Metadata;

use PHPUnit\Framework\TestCase;

abstract class AbstractMetadataTest extends TestCase {

	/**
	 * Base directory for metadata files
	 */
	protected string $metadataBasePath;

	/**
	 * Set up the test environment.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->metadataBasePath = realpath(__DIR__ . '/../../../src/backend/Resources/metadata');
		$this->assertNotFalse($this->metadataBasePath, 'Metadata directory not found');
	}

	/**
	 * Glob metadata files based on a path pattern and call a callback for each result.
	 *
	 * @param  string   $filePattern Pattern for file search (e.g., 'app/scheduledJobs.json')
	 * @param  callable $callback    Callback to process each found file
	 * @return int      Number of files processed
	 */
	protected function processMetadataFiles(string $filePattern, callable $callback): int {
		$fullPattern = $this->metadataBasePath . '/' . $filePattern;
		$files = glob($fullPattern);
        
		$this->assertNotFalse($files, "Failed to glob files using pattern: $filePattern");
        
		$count = 0;
		foreach ($files as $file) {
			$jsonContent = file_get_contents($file);
			$this->assertNotFalse($jsonContent, "Failed to read file: $file");
            
			$data = json_decode($jsonContent, true);
			$this->assertNotNull($data, "Failed to parse JSON in file: $file");
            
			$callback($data, $file);
			$count++;
		}
        
		return $count;
	}

	/**
	 * Navigate through a JSON structure following a path and apply a callback to the final values.
	 *
	 * @param  mixed    $data        The JSON data structure
	 * @param  array    $path        Path segments to follow in the data structure (e.g., ['app', 'scheduledJobs', '*', 'jobClassName'])
	 * @param  callable $callback    Function to call on each final value
	 * @param  array    $context     Current path context (used for recursion)
	 * @param  bool     $allowAppend Whether to allow and process "__APPEND__" values
	 * @return int      Number of values processed
	 */
	protected function walkJsonPath(
		$data, 
		array $path, 
		callable $callback, 
		array $context, 
		bool $allowAppend
	): int {
		if (empty($path)) {
			// Skip __APPEND__ if not allowed
			if (!$allowAppend && is_string($data) && $data === '__APPEND__') {
				return 0;
			}
            
			$callback($data, $context);

			return 1;
		}

		// If data is not an array, we can't traverse further
		if (!is_array($data)) {
			return 0;
		}

		$segment = array_shift($path);
		$count = 0;

		if ($segment === '*') {
			// Wildcard: process all keys at this level
			foreach ($data as $key => $value) {
				$newContext = array_merge($context, [$key]);
				$count += $this->walkJsonPath($value, $path, $callback, $newContext, $allowAppend);
			}
		} elseif (isset($data[$segment])) {
			// Named key: process only this key
			$newContext = array_merge($context, [$segment]);
			$count += $this->walkJsonPath($data[$segment], $path, $callback, $newContext, $allowAppend);
		}

		return $count;
	}
    
	/**
	 * Check if all classes at a specific JSON path implement an interface.
	 *
	 * @param  string $filePattern Pattern for file search (e.g., 'app/scheduledJobs.json')
	 * @param  array  $path        Path segments in the JSON (e.g., ['*', 'jobClassName'])
	 * @param  string $interface   Full interface class name to check for
	 * @param  bool   $mandatory   Whether all elements at the path must exist (false allows missing paths)
	 * @return void
	 */
	protected function assertJsonPathClassesImplementInterface(
		string $filePattern, 
		array $path, 
		string $interface,
		bool $mandatory,
		bool $allowAppend
	): void {
		$processedCount = $this->processMetadataFiles($filePattern, function ($data, $file) use ($path, $interface, $mandatory, $allowAppend) {
			$this->assertIsArray($data, "File does not contain a valid JSON object: $file");
            
			$valuesProcessed = $this->walkJsonPath($data, $path, function ($className, $context) use ($interface, $file, $allowAppend) {
				// Skip __APPEND__ special value
				if ($allowAppend && $className === '__APPEND__') {
					return;
				}
                
				$this->assertIsString($className, "Value at path is not a class name string in file: $file");
				$pathStr = implode(' -> ', $context);
                
				// Check if class exists
				$this->assertTrue(
					class_exists($className), 
					"Class '$className' at path '$pathStr' does not exist"
				);
                
				// Check interface implementation
				$reflection = new \ReflectionClass($className);
				$this->assertTrue(
					$reflection->implementsInterface($interface),
					"Class '$className' at path '$pathStr' must implement $interface"
				);
			}, [], $allowAppend);
            
			if ($mandatory) {
				$this->assertGreaterThan(0, $valuesProcessed, "No values processed for file: $file with path " . implode('/', $path));
			}
		});
	}
    
	/**
	 * Check if class names at a specific JSON path are valid classes.
	 *
	 * @param  string $filePattern Pattern for file search
	 * @param  array  $path        Path segments in the JSON
	 * @param  bool   $mandatory   Whether all elements at the path must exist (false allows missing paths)
	 * @return void
	 */
	protected function assertJsonPathClassesExist(
		string $filePattern, 
		array $path, 
		bool $mandatory,
		bool $allowAppend
	): void {
		$processedCount = $this->processMetadataFiles($filePattern, function ($data, $file) use ($path, $mandatory, $allowAppend) {
			$this->assertIsArray($data, "File does not contain a valid JSON object: $file");
            
			$valuesProcessed = $this->walkJsonPath($data, $path, function ($className, $context) use ($file, $allowAppend) {
				// Skip __APPEND__ special value
				if ($allowAppend && $className === '__APPEND__') {
					return;
				}
                
				$this->assertIsString($className, "Value at path is not a class name string in file: $file");
				$pathStr = implode(' -> ', $context);
                
				// Check if class exists
				$this->assertTrue(
					class_exists($className), 
					"Class '$className' at path '$pathStr' does not exist"
				);
			}, [], $allowAppend);
            
			if ($mandatory) {
				$this->assertGreaterThan(0, $valuesProcessed, "No values processed for file: $file with path " . implode('/', $path));
			}
		});
	}

}