<?php

namespace Espo\Modules\Autocrm\Core\Record;

use Espo\Core\Api\Request;
use Espo\Core\InjectableFactory;
use Espo\Core\Record\CreateParams;
use Espo\Core\Record\CreateParamsFetcher;
use Espo\Core\Record\DeleteParams;
use Espo\Core\Record\DeleteParamsFetcher;
use Espo\Core\Record\ReadParams;
use Espo\Core\Record\ReadParamsFetcher;
use Espo\Core\Record\UpdateParams;
use Espo\Core\Record\UpdateParamsFetcher;
use Espo\Core\Utils\Metadata;

/**
 * @template TParamsFetcher of ReadParamsFetcher|CreateParamsFetcher|UpdateParamsFetcher|DeleteParamsFetcher
 * @template TParams of ReadParams|CreateParams|UpdateParams|DeleteParams
 */
trait ParamsFetcherTrait {

	public function __construct(
		protected readonly InjectableFactory $injectableFactory,
		protected readonly Metadata          $metadata,
	) {}

	/**
	 * @throws \Exception
	 * @return TParams
	 */
	protected function fetchInternal(
		Request $request
	): mixed {
		$controllerName = $request->getRouteParam('controller');

		if (!$controllerName) {
			return parent::fetch($request);
		}

		$paramsFetcherClassName = $this->metadata->get(
			['recordDefs', $controllerName, "{$this->type}ParamsFetcherClassName"],
			null
		);

		if (!$paramsFetcherClassName) {
			return parent::fetch($request);
		}

		if (!is_string($paramsFetcherClassName) || !class_exists($paramsFetcherClassName)) {
			throw new \RuntimeException("Invalid or non-existent class name fetched from metadata for '{$this->type}' ParamsFetcher: " . print_r($paramsFetcherClassName, true));
		}

		/**
		 * @phpstan-var class-string<TParamsFetcher> $paramsFetcherClassName
		 * @var TParamsFetcher $paramsFetcher
		 */
		$paramsFetcher = $this->injectableFactory->create($paramsFetcherClassName);

		/** @var class-string $fetcherBaseClass Determined by the Factory class using the trait */
		$fetcherBaseClass = get_parent_class($this);
		if (!$fetcherBaseClass) {
			throw new \LogicException('Class using ParamsFetcherTrait must have a parent class.');
		}

		if (!is_a($paramsFetcher, $fetcherBaseClass)) {
			throw new \RuntimeException("Params fetcher for '{$this->type}' operation ({$paramsFetcherClassName}) must be an instance of {$fetcherBaseClass}");
		}

		return $paramsFetcher->fetch($request);
	}

}