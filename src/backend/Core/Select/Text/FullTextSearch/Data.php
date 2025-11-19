<?php

namespace Espo\Modules\Autocrm\Core\Select\Text\FullTextSearch;

use Espo\ORM\Query\Part\Expression;
use InvalidArgumentException;

/**
 * @immutable
 */
class Data extends \Espo\Core\Select\Text\FullTextSearch\Data {

	/**
	 * @param Expression $expression
	 * @param string[]   $fieldList
	 * @param string[]   $columnList
	 * @param string     $mode
	 */
	public function __construct(
		private Expression $expression,
		/** @var string[] */
		private array              $fieldList,
		/** @var string[] */
		private array              $columnList,
		/** @var string */
		private string             $mode
	) {
		if (!in_array($mode, Mode::ALLOWED_MODES)) {
			throw new InvalidArgumentException("Mode not allowed: $mode.");
		}
	}

	public function getExpression(): Expression {
		return $this->expression;
	}

	/**
	 * @return string[]
	 */
	public function getFieldList(): array {
		return $this->fieldList;
	}

	/**
	 * @return string[]
	 */
	public function getColumnList(): array {
		return $this->columnList;
	}

	/**
	 * @return string
	 */
	public function getMode(): string {
		return $this->mode;
	}

}