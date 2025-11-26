<?php

namespace Espo\Modules\Viacrm\Tools\Layout;

use Espo\Core\DataManager;
use Espo\Core\Exceptions\Error;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Language;
use Espo\Core\Utils\Metadata;
use Espo\Tools\LayoutManager\LayoutManager;

class Service {
	public function __construct(
		private readonly Metadata      $metadata,
		private readonly Language      $language,
		private readonly DataManager   $dataManager,
		private readonly LayoutManager $layoutManager,
	) {}

	/**
	 * @throws Error
	 * @throws \JsonException
	 */
	public function add(string $type, string $scope, string $name, string $label): ?string {
		$json = $this->layoutManager->get($scope, $type);
		$data = $json ? Json::decode($json) : [];

		$this->layoutManager->set($data, $scope, $name);
		$this->layoutManager->save();

		$additionalLayouts = $this->metadata->get(['clientDefs', $scope, 'additionalLayouts'], []);
		$additionalLayouts[$name] = [
			'type' => $type,
		];

		$this->metadata->set('clientDefs', $scope, ['additionalLayouts' => $additionalLayouts]);
		$this->metadata->save();

		$this->language->set('Admin', 'layouts', $name, $label);
		$this->language->save();

		$this->dataManager->clearCache();

		return $this->layoutManager->get($scope, $name);
	}
}
