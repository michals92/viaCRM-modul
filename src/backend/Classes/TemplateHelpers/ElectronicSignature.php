<?php

namespace Espo\Modules\Autocrm\Classes\TemplateHelpers;

use Espo\Core\Htmlizer\Helper;
use Espo\Core\Htmlizer\Helper\Data;
use Espo\Core\Htmlizer\Helper\Result;
use Espo\Modules\Autocrm\Tools\Html\Composer as HtmlComposer;

class ElectronicSignature implements Helper {

	private const DEFAULT_WIDTH = 100;

	private const DEFAULT_HEIGHT = 'auto';

	public function render(Data $data): Result {
		$base30Str = $data->getArgumentList()[0];
		$width = $data->getOption('width') ?? self::DEFAULT_WIDTH;
		$height = $data->getOption('height') ?? self::DEFAULT_HEIGHT;

		if (!$base30Str) {
			return Result::createEmpty();
		}

		$parts = explode(',', $base30Str, 2);
		$base30 = $parts[1] ?? $parts[0];
		$nativeData = (new \jSignature_Tools_Base30())->Base64ToNative($base30);
		$svg = (new \jSignature_Tools_SVG())->NativeToSVG($nativeData);
		$dataString = base64_encode($svg);

		$attributes = [
			'src' => "data:image/svg+xml;base64,$dataString",
			'alt' => 'Electronic signature',
			'width' => $width,
			'height' => $height,
		];

		$html = HtmlComposer::compose('img', $attributes);

		return Result::createSafeString($html);
	}

}
