<?php

namespace Espo\Modules\Viacrm\Core\Log;

use Espo\Core\Api\Request;
use Espo\Core\Exceptions\HasBody;
use Monolog\Formatter\LineFormatter;
use Monolog\LogRecord;
use Throwable;

/** @disregard */
class ViacrmFormatter extends LineFormatter {

	// This is the only changed line from the original
	private const LINE_FORMAT = "[%datetime%] %level_name%: %code% %message% %request% %exception% %context% %extra%\n";
	private const DATE_FORMAT = 'Y-m-d H:i:s';

	public function __construct(
		private bool $includeTraces = false,
	) {
		parent::__construct(
			format: self::LINE_FORMAT,
			dateFormat: self::DATE_FORMAT,
			ignoreEmptyContextAndExtra: true,
			includeStacktraces: $this->includeTraces,
		);
	}

	/** @disregard */
	public function format(LogRecord $record): string {
		$line = parent::format($record);

		$line = $this->interpolate($record, $line);
		$line = $this->addCode($record, $line);
		$line = $this->addRequest($record, $line);
		$line = $this->addException($record, $line);

		return trim($line) . "\n";
	}

	/** @disregard */
	private function addCode(LogRecord $record, string $line): string {
		$exception = $record->context['exception'] ?? null;

		if (!$exception instanceof Throwable) {
			return str_replace('%code% ', '', $line);
		}

		$codePart = "({$exception->getCode()})";

		return str_replace('%code% ', $codePart . ' ', $line);
	}

	/** @disregard */
	private function addException(LogRecord $record, string $line): string {
		$exception = $record->context['exception'] ?? null;

		if (!$exception instanceof Throwable) {
			return str_replace('%exception%', '', $line);
		}

		if (!$exception instanceof HasBody || !$exception->getBody()) {
			$part = ":: {$exception->getFile()}({$exception->getLine()})";

			$line = str_replace('%exception%', $part, $line);
		} else {
			$line = str_replace('%exception%', '', $line);
		}

		if (!$this->includeTraces) {
			return $line;
		}

		/** @disregard */
		$line .= $this->normalizeException($exception);

		return $line;
	}

	/** @disregard */
	private function addRequest(LogRecord $record, string $line): string {
		$request = $record->context['request'] ?? null;

		if (!$request instanceof Request) {
			return str_replace('%request% ', '', $line);
		}

		$requestPart = ":: {$request->getMethod()} {$request->getResourcePath()}";

		return str_replace('%request%', $requestPart, $line);
	}

	/** @disregard */
	private function interpolate(LogRecord $record, mixed $line): string {
		$replace = [];

		foreach ($record->context as $key => $val) {
			if (!is_array($val) && (!is_object($val) || method_exists($val, '__toString'))) {
				$replace['{' . $key . '}'] = $val;
			}
		}

		$line = strtr($line, $replace);

		return $line;
	}

}
