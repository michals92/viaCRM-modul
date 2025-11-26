<?php

namespace Espo\Modules\Viacrm\Tools\Aggregation;

use Espo\Core\Exceptions\NotFound;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Metadata;

class AggregationFunctionFactory
{
	public function __construct(
		private readonly InjectableFactory $injectableFactory,
		private readonly Metadata $metadata,
	) {
	}

	/**
	 * @throws NotFound
	 */
	public function create(string $functionName, ?string $entityType = null): AggregationFunction
	{
		$className = $this->getClassName($functionName, $entityType);

		if (!$className) {
			throw new NotFound('Aggregation function "' . $functionName . '" not found.');
		}

		return $this->injectableFactory->create($className);
	}

	/**
	 * @return ?class-string<AggregationFunction>
	 */
	private function getClassName(string $functionName, ?string $entityType = null): ?string
	{
		if ($entityType) {
			$className = $this->getEntityTypeClassName($functionName, $entityType);

			if ($className) {
				return $className;
			}
		}

		$functionDefs = $this->metadata->get(['aggregationFunctions', $functionName], []);

		if (!$functionDefs) {
			return null;
		}

		return $functionDefs['className'] ?? BaseAggregationFunction::class;
	}

	/**
	 * @return ?class-string<AggregationFunction>
	 */
	private function getEntityTypeClassName(string $functionName, string $entityType): ?string
	{
		return $this->metadata->get(
			['recordDefs', $entityType, 'aggregationFunctions', $functionName, 'implementationClassName']
		);
	}
}
