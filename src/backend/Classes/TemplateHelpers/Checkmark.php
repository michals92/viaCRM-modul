<?php

namespace Espo\Modules\Viacrm\Classes\TemplateHelpers;

use Espo\Core\Htmlizer\Helper;
use Espo\Core\Htmlizer\Helper\Data;
use Espo\Core\Htmlizer\Helper\Result;
use Espo\Modules\Viacrm\Tools\Html\Composer as HtmlComposer;

class Checkmark implements Helper {

	public function render(Data $data): Result {
		$value = $data->getArgumentList()[0] ? '√' : '×';

		$attributes = [
		    'class' => 'helper-checkmark',
		    'style' => 'font-weight: bold; font-style: italic;',
		    'font-style' => 'italic',
		];        

		$html = HtmlComposer::compose('span', $attributes, $value);

		return Result::create($html);
	}

}
