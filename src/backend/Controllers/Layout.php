<?php

namespace Espo\Modules\Autocrm\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Di;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;
use Espo\Modules\Autocrm\Tools\Layout\Service as LayoutService;

class Layout extends \Espo\Controllers\Layout implements Di\UserAware, Di\InjectableFactoryAware {
	use Di\UserSetter;
	use Di\InjectableFactorySetter;

	private ?LayoutService $service = null;

	/**
	 * @throws BadRequest
	 * @throws Forbidden
	 * @throws Error
	 * @throws \JsonException
	 */
	public function postActionAdd(Request $request): ?string {
		if (!$this->user->isAdmin()) {
			throw new Forbidden();
		}

		$data = $request->getParsedBody();

		$scope = $data->scope ?? throw new BadRequest();
		$name = $data->name ?? throw new BadRequest();
		$type = $data->type;
		$label = $data->label;

		if (!$scope || !$name) {
			throw new BadRequest();
		}

		$sanitizedScope = $this->sanitizeInput($scope) ?? throw new BadRequest();
		$sanitizedName = $this->sanitizeInput($name) ?? throw new BadRequest();

		return $this->getService()->add($type, $sanitizedScope, $sanitizedName, $label);
	}

	protected function sanitizeInput(string $name): ?string {
		return preg_replace("([\.]{2,})", '', $name);
	}

	private function getService(): LayoutService {
		return $this->service ??= $this->injectableFactory->create(LayoutService::class);
	}

}
