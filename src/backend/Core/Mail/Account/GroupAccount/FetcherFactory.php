<?php

namespace Espo\Modules\Viacrm\Core\Mail\Account\GroupAccount;

use Espo\Core\Binding\BindingContainerBuilder;
use Espo\Core\Binding\Factory;
use Espo\Core\InjectableFactory;
use Espo\Core\Mail\Account\Fetcher;
use Espo\Core\Mail\Account\GroupAccount\Hooks\AfterFetch as GroupAccountAfterFetch;
use Espo\Core\Mail\Account\GroupAccount\StorageFactory as GroupAccountStorageFactory;
use Espo\Core\Mail\Account\Hook\AfterFetch;
use Espo\Core\Mail\Account\Hook\BeforeFetch;
use Espo\Core\Mail\Account\StorageFactory;
use Espo\Modules\Viacrm\Core\Mail\Account\Fetcher as ViacrmFetcher;
use Espo\Modules\Viacrm\Core\Mail\Account\GroupAccount\Hooks\BeforeFetch as GroupAccountBeforeFetch;

/**
 * @implements Factory<Fetcher>
 */
class FetcherFactory implements Factory
{
	public function __construct(
		protected readonly InjectableFactory $injectableFactory
	) {
	}

	public function create(): Fetcher
	{
		$binding = BindingContainerBuilder::create()
			->bindImplementation(BeforeFetch::class, GroupAccountBeforeFetch::class)
			->bindImplementation(AfterFetch::class, GroupAccountAfterFetch::class)
			->bindImplementation(StorageFactory::class, GroupAccountStorageFactory::class)
			->build();

		return $this->injectableFactory->createWithBinding(ViacrmFetcher::class, $binding);
	}
}
