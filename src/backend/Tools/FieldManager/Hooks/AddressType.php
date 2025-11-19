<?php

namespace Espo\Modules\Autocrm\Tools\FieldManager\Hooks;

use Espo\Core\Utils\Metadata;

class AddressType {

	public function __construct(
		private readonly Metadata $metadata
	) {}

	public function afterSave(string $scope, string $name, mixed $defs, mixed $options): void {
		if ($defs['saveCoordinates']) {
			$this->metadata->set(
				'entityDefs',
				$scope,
				[
				    'fields' => [
				        $name . 'Lat' => [
				            'type' => 'float',
				        ],
				        $name . 'Lng' => [
				            'type' => 'float',
				        ],
				    ],
				]
			);

			$this->metadata->save();
		}
	}

}
