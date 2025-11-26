<?php

namespace Espo\Modules\Viacrm\Classes\VariableCss\Sources;

use Espo\Core\ORM\EntityManager;
use Espo\Modules\Viacrm\Classes\VariableCss\Source as VariableCssSource;
use Espo\ORM\Query\SelectBuilder;
use PDO;

class CustomIcons implements VariableCssSource {
	public function __construct(
		private readonly EntityManager $entityManager,
	) {}

	public function get(): string {
		$ids = $this
		    ->entityManager
		    ->getQueryExecutor()
		    ->execute(
		    	SelectBuilder::create()
		    	    ->select('id')
		    	    ->from('CustomIcon')
		    	    ->where('deleted', false)
		    	    ->build()
		    )
		    ->fetchAll(PDO::FETCH_COLUMN);

		$styles = '';

		foreach ($ids as $id) {
			$styles .= ".custom-icon-$id{mask:url('?entryPoint=customIcon&id=$id');-webkit-mask:url('?entryPoint=customIcon&id=$id')}\n";
		}

		return $styles;
	}
}
