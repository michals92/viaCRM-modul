<?php

namespace Espo\Modules\Viacrm\Classes\TemplateHelpers;

use Espo\Core\Htmlizer\Helper;
use Espo\Core\Htmlizer\Helper\Data;
use Espo\Core\Htmlizer\Helper\Result;
use Espo\Modules\Viacrm\Tools\Html\Composer as HtmlComposer;

class ImgTag implements Helper {
	public function render(Data $data): Result {
		$attachmentId = $data->getArgumentList()[0];

		$width = $data->getArgumentList()[1] ?? null;
		$height = $data->getArgumentList()[2] ?? null;

		if (empty($attachmentId)) {
			return Result::createEmpty();
		}

		$attributes = [
		    'src' => "?entryPoint=attachment&id=$attachmentId",
		];

		if (!empty($width)) {
			$attributes['width'] = $width;
		}

		if (!empty($height)) {
			$attributes['height'] = $height;
		}

		$html = HtmlComposer::compose('img', $attributes);

		return Result::createSafeString($html);
	}
}
