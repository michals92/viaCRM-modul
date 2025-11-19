<?php

namespace Espo\Modules\Autocrm\Core\Mail\Account\Ews\PersonalAccount;

use Espo\Core\Binding\BindingContainerBuilder;
use Espo\Core\Binding\Factory;
use Espo\Core\InjectableFactory;
use Espo\Modules\Autocrm\Core\Mail\Account\Ews\Fetcher;

/**
 * Factory for creating EWS Fetcher instances.
 *
 * @implements Factory<Fetcher>
 */
class FetcherFactory implements Factory {

	public function __construct(
		private InjectableFactory $injectableFactory
	) {}

	public function create(): Fetcher {
		$binding = BindingContainerBuilder::create()->build();

		return $this->injectableFactory->createWithBinding(Fetcher::class, $binding);
	}

}
