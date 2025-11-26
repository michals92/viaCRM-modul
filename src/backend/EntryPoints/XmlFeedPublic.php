<?php

namespace Espo\Modules\Viacrm\EntryPoints;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\EntryPoint\EntryPoint;
use Espo\Core\EntryPoint\Traits\NoAuth;
use Espo\Modules\Viacrm\Tools\Xml\EntryPointProcessor;

class XmlFeedPublic implements EntryPoint {
	use NoAuth;

	public function __construct(
		private readonly EntryPointProcessor $entryPointProcessor
	) {}

	public function run(Request $request, Response $response): void {
		$this->entryPointProcessor->process($request, $response, true);
	}
}