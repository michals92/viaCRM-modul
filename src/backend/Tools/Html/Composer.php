<?php

namespace Espo\Modules\Viacrm\Tools\Html;

use Stringable;

class Composer {
	/**
	 * @param array<string, mixed> $attributes
	 */
	public static function compose(string $tag, array $attributes = [], null|string|Stringable $inner = null): string {
		$html = "<$tag";
		foreach ($attributes as $key => $value) {
			$html .= " $key=\"$value\"";
		}

		if ($inner) {
			$html .= ">$inner</$tag>";
		} else {
			$html .= ' />';
		}

		return $html;
	}
}