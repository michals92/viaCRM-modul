<?php

namespace Espo\Modules\Viacrm\Core\Api;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\HasBody;
use Espo\Core\Exceptions\HasLogMessage;
use Espo\Core\Utils\Log;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Throwable;

class ErrorOutput extends \Espo\Core\Api\ErrorOutput {
	public function __construct(
		private Log $log
	) {
		parent::__construct($log);
	}

	public function process(
		Request $request,
		Response $response,
		Throwable $exception,
		?string $route = null
	): void {
		$this->processInternal($request, $response, $exception, $route);
	}

	public function processWithBodyPrinting(
		Request $request,
		Response $response,
		Throwable $exception,
		?string $route = null
	): void {
		$this->processInternal($request, $response, $exception, $route, true);
	}

	private function processInternal(
		Request $request,
		Response $response,
		Throwable $exception,
		?string $route = null,
		bool $toPrintBody = false
	): void {
		$message = $exception->getMessage();

		if ($exception->getPrevious() && $exception->getPrevious()->getMessage()) {
			$message .= ' ' . $exception->getPrevious()->getMessage();
		}

		$statusCode = $exception->getCode();

		if ($exception instanceof HasLogMessage) {
			$message = $exception->getLogMessage();
		}

		if ($route) {
			$this->processRoute($route, $request, $exception);
		}

		$level = $this->getLevel($exception);

		$this->log->log($level, $message, [
		    'exception' => $exception,
		    /** This is the modified line from the parent */
		    'trace' => $exception->getTraceAsString(),
		    'request' => $request,
		]);

		if (!in_array($statusCode, ReflectionUtil::getClassProperty(parent::class, $this, 'allowedStatusCodeList'))) {
			$statusCode = 500;
		}

		$response->setStatus($statusCode);

		if ($this->toPrintExceptionStatusReason($exception)) {
			$response->setHeader('X-Status-Reason', $this->stripInvalidCharactersFromHeaderValue($message));
		}

		if ($exception instanceof HasBody && $this->exceptionHasBody($exception)) {
			$response->writeBody($exception->getBody() ?? '');

			$toPrintBody = false;
		}

		if ($toPrintBody) {
			$codeDescription = $this->getCodeDescription($statusCode);

			$statusText = isset($codeDescription) ?
			    $statusCode . ' '. $codeDescription :
			    'HTTP ' . $statusCode;

			if ($message) {
				$message = htmlspecialchars($message);
			}

			$response->writeBody(self::generateErrorBody($statusText, $message));
		}
	}

	private function exceptionHasBody(Throwable $exception): bool {
		return ReflectionUtil::callClassMethod(parent::class, $this, 'exceptionHasBody', $exception);
	}

	private function getCodeDescription(int $statusCode): ?string {
		return ReflectionUtil::callClassMethod(parent::class, $this, 'getCodeDescription', $statusCode);
	}

	private static function generateErrorBody(string $header, string $text): string {
		return ReflectionUtil::callClassStaticMethod(parent::class, 'generateErrorBody', $header, $text);
	}

	private function stripInvalidCharactersFromHeaderValue(string $value): string {
		return ReflectionUtil::callClassMethod(parent::class, $this, 'stripInvalidCharactersFromHeaderValue', $value);
	}

	private function processRoute(string $route, Request $request, Throwable $exception): void {
		ReflectionUtil::callClassMethod(parent::class, $this, 'processRoute', $route, $request, $exception);
	}

	private function toPrintExceptionStatusReason(Throwable $exception): bool {
		return ReflectionUtil::callClassMethod(parent::class, $this, 'toPrintExceptionStatusReason', $exception);
	}

	private function getLevel(Throwable $exception): string {
		return ReflectionUtil::callClassMethod(parent::class, $this, 'getLevel', $exception);
	}
}