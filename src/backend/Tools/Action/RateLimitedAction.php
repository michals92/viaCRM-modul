<?php

namespace Espo\Modules\Autocrm\Tools\Action;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Di;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Utils\DataCache;

/**
 * Abstracts rate limiting for API actions.
 *
 * The rate limit parameters can be configured by overriding the protected properties:
 * - `$maxCount`: Maximum number of allowed requests within the time window. Defaults to 3.
 * - `$window`: Time window duration in seconds. Defaults to 60.
 *
 * Responses (both successful and rate-limited) will include the following headers:
 * - `X-RateLimit-Limit`: The maximum number of requests allowed.
 * - `X-RateLimit-Remaining`: The number of requests remaining in the current window.
 * - `X-RateLimit-Reset`: The Unix timestamp when the rate limit window resets.
 */
abstract class RateLimitedAction implements Action, Di\DataCacheAware {
	use Di\DataCacheSetter;

	protected int $maxCount = 3;

	protected int $window = 60;

	abstract function rateLimitedProcess(Request $request): Response;

	public function process(Request $request): Response {
		[$allowed, $headers] = $this->rateLimit($request, $this->dataCache);

		if (!$allowed) {
			return ResponseComposer::empty()
				->setStatus(429, 'Too many requests, rate limit exceeded')
				->addHeader('X-RateLimit-Limit', $headers->limit)
				->addHeader('X-RateLimit-Remaining', $headers->remaining)
				->addHeader('X-RateLimit-Reset', $headers->reset);
		}

		return $this->rateLimitedProcess($request)
			->addHeader('X-RateLimit-Limit', $headers->limit)
			->addHeader('X-RateLimit-Remaining', $headers->remaining)
			->addHeader('X-RateLimit-Reset', $headers->reset);
	}

	/**
	 * @return array{0: bool, 1: object{limit: string, remaining: string, reset: string}}
	 */
	private function rateLimit(Request $request, DataCache $cache): array {
		$ip = $request->getServerParam('REMOTE_ADDR') ?: $request->getHeader('X-Forwarded-For');
		if (!$ip) {
			throw new Forbidden('Could not determine client IP address for rate limiting.');
		}

		$sanitizedIp = str_replace('.', '_', $ip);
		$pathParts = explode('/', strtolower($request->getResourcePath()));
		$endpoint = end($pathParts);
		$key = "{$endpoint}_rate_limit_ip_{$sanitizedIp}";
		$currentTime = time();

		if (!$cache->has($key)) {
			$cache->store($key, (object) [
				'count' => 1,
				'timestamp' => $currentTime
			]);

			return [
				true,
				(object) [
					'limit' => (string) $this->maxCount,
					'remaining' => (string) ($this->maxCount - 1),
					'reset' => (string) ($currentTime + $this->window)
				]
			];
		}

		$data = (object) $cache->get($key);

		if (($currentTime - $data->timestamp) >= $this->window) {
			$data->count = 1;
			$data->timestamp = $currentTime;
			$cache->store($key, $data);

			return [
				true,
				(object) [
					'limit' => (string) $this->maxCount,
					'remaining' => (string) ($this->maxCount - 1),
					'reset' => (string) ($currentTime + $this->window)
				]
			];
		}

		if ($data->count >= $this->maxCount) {
			$remainingTime = $this->window - ($currentTime - $data->timestamp);
			$resetTimestamp = $currentTime + $remainingTime;

			return [
				false,
				(object) [
					'limit' => (string) $this->maxCount,
					'remaining' => '0',
					'reset' => (string) $resetTimestamp
				]
			];
		}

		$data->count++;
		$cache->store($key, $data);

		return [
			true,
			(object) [
				'limit' => (string) $this->maxCount,
				'remaining' => (string) ($this->maxCount - $data->count),
				'reset' => (string) ($data->timestamp + $this->window)
			]
		];
	}

}
