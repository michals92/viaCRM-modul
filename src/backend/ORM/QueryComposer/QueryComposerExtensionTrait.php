<?php

namespace Espo\Modules\Viacrm\ORM\QueryComposer;

use Espo\ORM\Query\Part\Expression;

/** This trait exists to avoid code duplication */
trait QueryComposerExtensionTrait
{
	/** This function is extended to allow expressions.
	 * @param string               $entityType
	 * @param array<string, mixed> $values
	 *
	 * @return string
	 */
	protected function getInsertUpdatePartExtended(string $entityType, array $values): string
	{
		$list = [];
		$seed = $this->getSeed($entityType);

		foreach ($values as $column => $value) {
			// Quote the column name.
			$quotedColumn = $this->quoteIdentifier(
				// @phpstan-ignore method.deprecated
				$this->toDb($this->sanitize($column))
			);

			if ($value instanceof Expression) {
				$params = [];
				$rawSql = $this->convertComplexExpression($seed, $value->getValue(), false, $params);

				$list[] = $quotedColumn . ' = ' . $rawSql;
			} else {
				// @phpstan-ignore method.deprecated
				$list[] = $quotedColumn . ' = ' . $this->quote($value);
			}
		}

		return implode(', ', $list);
	}
}
