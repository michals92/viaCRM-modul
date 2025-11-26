<?php

namespace Espo\Modules\Viacrm\Classes\TemplateHelpers;

use Espo\Core\Htmlizer\Helper;
use Espo\Core\Htmlizer\Helper\Data;
use Espo\Core\Htmlizer\Helper\Result;

class SmartPageBreak implements Helper {
	public function __construct(
	) {}

	public function render(Data $data): Result {
		$selector = strval($data->getOption('selector'));
		$threshold = floatval($data->getOption('threshold') ?? 0.5);

		$script = <<<TEXT
    <script>
      document.addEventListener("DOMContentLoaded", () => {
        const elements = document.querySelectorAll('{$selector}');
        
        elements.forEach((e) => {
          e.style.pageBreakBefore = '';
        });
        
        const printablePageHeight = 920;
        let cumulativePagePosition = 0;
        
        elements.forEach((e, index) => {
          const positionOnCurrentPage = cumulativePagePosition % 1.0;
          
          if (positionOnCurrentPage > {$threshold}) {
            e.style.pageBreakBefore = 'always';
            cumulativePagePosition = Math.ceil(cumulativePagePosition);
          }
          
          const nextElement = elements[index + 1];
          if (nextElement) {
            const sectionHeight = nextElement.offsetTop - e.offsetTop;
            cumulativePagePosition += sectionHeight / printablePageHeight;
          } else {
            const docHeight = document.body.scrollHeight;
            const remainingHeight = docHeight - e.offsetTop;
            cumulativePagePosition += remainingHeight / printablePageHeight;
          }
        });
      });
    </script>
TEXT;

		return Result::createSafeString($script);
	}
}
