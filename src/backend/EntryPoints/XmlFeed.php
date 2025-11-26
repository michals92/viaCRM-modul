<?php

namespace Espo\Modules\Viacrm\EntryPoints;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\EntryPoint\EntryPoint;
use Espo\Modules\Viacrm\Tools\Xml\EntryPointProcessor;

class XmlFeed implements EntryPoint
{
	public function __construct(
		private readonly EntryPointProcessor $entryPointProcessor
	) {
	}

	public function run(Request $request, Response $response): void
	{
		$this->entryPointProcessor->process($request, $response, false);
	}
}
