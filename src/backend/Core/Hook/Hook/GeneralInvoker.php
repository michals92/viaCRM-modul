<?php

namespace Espo\Modules\Viacrm\Core\Hook\Hook;

use Espo\Core\Di;
use Espo\Modules\Viacrm\Classes\Utils\ExtensionUtil;
use Espo\Modules\Viacrm\Core\Hook\ConditionalHook\Abstract\ConditionalHook;

class GeneralInvoker extends \Espo\Core\Hook\GeneralInvoker implements Di\ConfigAware {
	use Di\ConfigSetter;

	/** @inheritDoc */
	public function invoke(
		object $hook,
		string $name,
		mixed  $subject,
		array  $options,
		array  $hookData,
	): void {
		if (
			($hook instanceof ConditionalHook) &&
			(!ExtensionUtil::fromConfig($this->config)->areAllRequiredExtensionsInstalled($hook->requiredExtensions))
		) {
			return;
		}

		parent::invoke($hook, $name, $subject, $options, $hookData);
	}

}