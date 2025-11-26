<?php

namespace Espo\Core\Services;

use Espo\Core\Traits\Injectable;

/**
 * This keeps compatibility with older versions of modules
 */
abstract class Base {
	// @phpstan-ignore traitUse.deprecated
	use Injectable;
}