<?php

namespace Espo\Modules\Viacrm\Core\Mail\Account\Ews;

use stdClass;

/**
 * EWS fetch synchronization state.
 * Stores the sync token/watermark for incremental synchronization.
 */
class FetchData {
	private function __construct(
		private ?string $syncState = null,
		private ?string $lastProcessedDate = null
	) {}

	public static function create(): self {
		return new self();
	}

	public static function fromRaw(stdClass $raw): self {
		$syncState = $raw->syncState ?? null;
		$lastProcessedDate = $raw->lastProcessedDate ?? null;

		return new self($syncState, $lastProcessedDate);
	}

	public function getRaw(): stdClass {
		return (object) [
		    'syncState' => $this->syncState,
		    'lastProcessedDate' => $this->lastProcessedDate,
		];
	}

	public function getSyncState(): ?string {
		return $this->syncState;
	}

	public function getLastProcessedDate(): ?string {
		return $this->lastProcessedDate;
	}

	public function withSyncState(?string $syncState): self {
		$obj = clone $this;
		$obj->syncState = $syncState;

		return $obj;
	}

	public function withLastProcessedDate(?string $lastProcessedDate): self {
		$obj = clone $this;
		$obj->lastProcessedDate = $lastProcessedDate;

		return $obj;
	}
}
