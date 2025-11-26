<?php

namespace Espo\Modules\ViaCrm\EntryPoints;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\EntryPoint\EntryPoint;
use Espo\Core\EntryPoint\Traits\NoAuth;

class TestEntryPoint implements EntryPoint
{
	use NoAuth;

	public function run(Request $request, Response $response): void
	{
		$response->setHeader('Content-Type', 'text/html; charset=utf-8');

		$response->writeBody('<!DOCTYPE html>
<html>
<head>
    <title>Test Entry Point</title>
</head>
<body>
    <h1>Test Entry Point Working!</h1>
    <p>Current time: ' . date('Y-m-d H:i:s') . '</p>
    <p>Request parameters:</p>
    <pre>' . print_r($request->getQueryParams(), true) . '</pre>
</body>
</html>');
	}
}
