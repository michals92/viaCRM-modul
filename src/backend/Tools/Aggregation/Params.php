<?php

namespace Espo\Modules\Viacrm\Tools\Aggregation;

use Espo\Core\Select\SearchParams;
use RuntimeException;

class Params
{
	private string $entityType;

	/**
	 * @var AggregationEntry[]
	 */
	private array $entries = [];

	private ?SearchParams $searchParams = null;

	private function __construct()
	{
	}

	/**
	 * @param array<string, mixed> $params
	 */
	public static function fromRaw(array $params, ?string $entityType = null): self
	{
		$obj = new self();

		$entityType = $entityType ?? $params['entityType'] ?? null;

		if (!$entityType) {
			throw new RuntimeException('No entity type.');
		}

		$obj->entityType = $entityType;
		$entries = $params['entries'] ?? [];

		if (!count($entries)) {
			throw new RuntimeException('No functions.');
		}

		$obj->entries = array_map(
			fn (array $entry) => AggregationEntry::create()
				->withName($entry['name'])
				->withFunction($entry['function'])
				->withField($entry['field']),
			$entries,
		);

		$where = $params['where'] ?? null;
		if ($where) {
			$obj->searchParams = SearchParams::fromRaw([
				'where' => $where,
			]);
		}

		return $obj;
	}

	public function getEntityType(): string
	{
		return $this->entityType;
	}

	/**
	 * @return AggregationEntry[]
	 */
	public function getEntries(): array
	{
		return $this->entries;
	}

	public function getSearchParams(): SearchParams
	{
		if (!$this->searchParams) {
			throw new RuntimeException('No search params.');
		}

		return $this->searchParams;
	}

	public function hasSearchParams(): bool
	{
		return $this->searchParams !== null;
	}
}
