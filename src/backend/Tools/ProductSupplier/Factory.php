<?php

namespace Espo\Modules\Viacrm\Tools\ProductSupplier;

use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Metadata;
use Espo\Modules\Viacrm\Tools\ProductSupplier\Abstract\ProductSupplierStrategy;

/**
 * Factory for creating product supplier strategy instances.
 */
class Factory
{
	/**
	 * Constructor.
	 *
	 * @param Metadata          $metadata          The metadata service
	 * @param InjectableFactory $injectableFactory The injectable factory
	 */
	public function __construct(
		private readonly Metadata $metadata,
		private readonly InjectableFactory $injectableFactory
	) {
	}

	/**
	 * Get the class name for a product supplier strategy.
	 *
	 * @param string $strategyName The name of the strategy
	 *
	 * @return string|null The class name or null if not found
	 */
	public function getClassName(string $strategyName): ?string
	{
		return $this->metadata->get(['app', 'product', 'productSupplierStrategyClassNameMap', $strategyName]);
	}

	/**
	 * Create a product supplier strategy instance.
	 *
	 * @param string $strategyName The name of the strategy to create
	 *
	 * @return ProductSupplierStrategy|null The created strategy instance or null if not found
	 */
	public function create(string $strategyName): ?ProductSupplierStrategy
	{
		$className = $this->getClassName($strategyName);

		if ($className === null) {
			return null;
		}

		/** @var class-string<ProductSupplierStrategy> $className */
		$instance = $this->injectableFactory->create($className);

		/** @phpstan-ignore-next-line */
		assert($instance instanceof ProductSupplierStrategy);

		return $instance;
	}
}
