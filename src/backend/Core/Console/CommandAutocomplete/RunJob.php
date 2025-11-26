<?php

namespace Espo\Modules\Viacrm\Core\Console\CommandAutocomplete;

use Espo\Core\Job\MetadataProvider;
use Espo\Core\Utils\ClassFinder;
use Espo\Modules\Viacrm\Core\Console\CommandAutocomplete;

class RunJob implements CommandAutocomplete {
	public function __construct(
		private readonly ClassFinder $classFinder,
		private readonly MetadataProvider $metadataProvider
	) {}

	public function getAutocompleteSuggestions(array $inputWords, string $currentWord): array {
		$list = array_map(
			static fn ($item) => ' ' . $item,
			array_unique(
				array_merge(
					array_keys($this->classFinder->getMap('Jobs')),
					$this->metadataProvider->getScheduledJobNameList()
				)
			)
		);

		asort($list);

		return $list;
	}
}