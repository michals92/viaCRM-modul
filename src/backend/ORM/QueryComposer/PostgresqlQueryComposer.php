<?php

namespace Espo\Modules\Viacrm\ORM\QueryComposer;

use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Query\Insert as InsertQuery;
use RuntimeException;

/**
 * Extended PostgreSQL query composer that adds support for expressions in insert queries.
 */
class PostgresqlQueryComposer extends \Espo\ORM\QueryComposer\PostgresqlQueryComposer {
	use QueryComposerExtensionTrait;

	// Allows use of Expressions in updateSet
	public function composeInsert(InsertQuery $query): string {
		$params = $query->getRaw();
		$params = $this->normalizeInsertParams($params);

		$entityType = $params['into'];
		$columns = $params['columns'];
		$updateSet = $params['updateSet'];

		$columnsPart = $this->getInsertColumnsPart($columns);
		$valuesPart = $this->getInsertValuesPart($entityType, $params);
		$updatePart = $updateSet ? $this->getInsertUpdatePartExtended($entityType, $updateSet) : null;

		$table = $this->toDb($entityType);

		$sql = 'INSERT INTO ' . $this->quoteIdentifier($table) . " ($columnsPart) $valuesPart";

		if ($updatePart) {
			$uniqueColumns = ReflectionUtil::callClassMethod(parent::class, $this, 'getEntityUniqueColumns', $entityType);

			$updateColumnsPart = implode(', ',
				// @phpstan-ignore method.deprecated
				array_map(fn ($item) => $this->quoteIdentifier($this->toDb($this->sanitize($item))), $uniqueColumns)
			);

			$sql .= " ON CONFLICT($updateColumnsPart) DO UPDATE SET " . $updatePart;
		}

		return $sql;
	}

	// This backports a fix with table aliases in delete queries.
	protected function composeDeleteQuery(
		string $table,
		?string $alias,
		string $where,
		?string $joins,
		?string $order,
		?int $limit
	): string {
		$sql = 'DELETE ';

		/* Alias removed from here */

		$sql .= 'FROM ' . $this->quoteIdentifier($table);

		if ($alias) {
			$sql .= ' AS ' . $this->quoteIdentifier($alias);
		}

		if ($joins) {
			$sql .= " $joins";
		}

		if ($where) {
			$sql .= " WHERE $where";
		}

		if ($order) {
			$sql .= " ORDER BY $order";
		}

		if ($limit !== null) {
			$sql = $this->limit($sql, null, $limit);
		}

		return $sql;
	}

	/**
	 * This function backports 2 fixes, detailed below.
	 * 
	 * @param string[]             $argumentPartList
	 * @param array<string, mixed> $params
	 */
	protected function getFunctionPart(
		string $function,
		string $part,
		array $params,
		string $entityType,
		bool $distinct,
		array $argumentPartList = []
	): string {
		if (in_array($function, ['MATCH_BOOLEAN', 'MATCH_NATURAL_LANGUAGE'])) {
			if (count($argumentPartList) < 2) {
				throw new RuntimeException('Not enough arguments for MATCH function.');
			}

			$queryPart = end($argumentPartList);
			$columnsPart = implode(
				" || ' ' || ",
				array_map(
					fn ($item) => "COALESCE($item, '')",
					array_slice($argumentPartList, 0, -1)
				)
			);

			return "TS_RANK_CD(TO_TSVECTOR($columnsPart), PLAINTO_TSQUERY($queryPart))";
		}

		if ($function === 'IF') {
			if (count($argumentPartList) < 3) {
				throw new RuntimeException('Not enough arguments for IF function.');
			}

			$conditionPart = $argumentPartList[0];
			$thenPart = $argumentPartList[1];
			$elsePart = $argumentPartList[2];

			return "CASE WHEN $conditionPart THEN $thenPart ELSE $elsePart END";
		}

		if ($function === 'ROUND') {
			if (count($argumentPartList) === 2 && $argumentPartList[1] === '0') {
				$argumentPartList = array_slice($argumentPartList, 0, -1);

				return "ROUND($argumentPartList[0])";
			}
		}

		if ($function === 'UNIX_TIMESTAMP') {
			$arg = $argumentPartList[0] ?? 'NOW()';

			return "FLOOR(EXTRACT(EPOCH FROM $arg))";
		}

		if ($function === 'BINARY') {
			// Not supported.
			return $argumentPartList[0] ?? '0';
		}

		if ($function === 'TZ') {
			if (count($argumentPartList) < 2) {
				throw new RuntimeException('Not enough arguments for function TZ.');
			}

			$offsetHoursString = $argumentPartList[1];
			if (str_starts_with($offsetHoursString, '\'') && str_ends_with($offsetHoursString, '\'')) {
				$offsetHoursString = substr($offsetHoursString, 1, -1);
			}

			// First fix
			if (str_contains($offsetHoursString, '.')) {
				$minutes = (int) (floatval($offsetHoursString) * 60);
				$minutesString = (string) $minutes;

				return "$argumentPartList[0] + INTERVAL '$minutesString MINUTE'";
			}

			return "$argumentPartList[0] + INTERVAL '$offsetHoursString HOUR'";
		}

		if ($function === 'POSITION_IN_LIST') {
			if (count($argumentPartList) <= 1) {
				return $this->quote(1);
			}

			$field = $argumentPartList[0];

			$pairs = array_map(
				fn($i) => [$i, $argumentPartList[$i]],
				array_keys($argumentPartList)
			);

			$whenParts = array_map(function ($item) use ($field) {
				$resolution = intval($item[0]);
				$value = $item[1];

				return " WHEN $field = $value THEN $resolution";
			}, array_slice($pairs, 1));

			return 'CASE' . implode('', $whenParts) . ' ELSE 0 END';
		}

		if ($function === 'IFNULL') {
			$function = 'COALESCE';
		}

		if (str_starts_with($function, 'YEAR_') && $function !== 'YEAR_NUMBER') {
			$fiscalShift = substr($function, 5);

			if (is_numeric($fiscalShift)) {
				$fiscalShift = (int) $fiscalShift;
				$fiscalFirstMonth = $fiscalShift + 1;

				return
				    "CASE WHEN EXTRACT(MONTH FROM $part) >= $fiscalFirstMonth THEN ".
				    "EXTRACT(YEAR FROM $part) ".
				    "ELSE EXTRACT(YEAR FROM $part) - 1 END";
			}
		}

		if (str_starts_with($function, 'QUARTER_') && $function !== 'QUARTER_NUMBER') {
			$fiscalShift = substr($function, 8);

			if (is_numeric($fiscalShift)) {
				$fiscalShift = (int) $fiscalShift;
				$fiscalFirstMonth = $fiscalShift + 1;
				$fiscalDistractedMonth = $fiscalFirstMonth < 4 ?
				    12 - $fiscalFirstMonth :
				    12 - $fiscalFirstMonth + 1;

				return
				    "CASE WHEN EXTRACT(MONTH FROM $part) >= $fiscalFirstMonth " .
				    'THEN ' .
				    'CONCAT(' .
				    "EXTRACT(YEAR FROM $part), '_', " .
				    "FLOOR((EXTRACT(MONTH FROM $part) - $fiscalFirstMonth) / 3) + 1" .
				    ') ' .
				    'ELSE ' .
				    'CONCAT(' .
				    "EXTRACT(YEAR FROM $part) - 1, '_', " .
				    "CEIL((EXTRACT(MONTH FROM $part) + $fiscalDistractedMonth) / 3)" .
				    ') ' .
				    'END';
			}
		}

		switch ($function) {
			case 'MONTH':
				return "TO_CHAR($part, 'YYYY-MM')";
			case 'DAY':
				return "TO_CHAR($part, 'YYYY-MM-DD')";
			case 'WEEK':
			case 'WEEK_0':
			case 'WEEK_1':
				if (str_starts_with($part, "'")) {
					$part = 'DATE ' . $part;
				}

				return "CONCAT(TO_CHAR($part, 'YYYY'), '/', TRIM(LEADING '0' FROM TO_CHAR($part, 'IW')))";
			case 'QUARTER':
				return "CONCAT(TO_CHAR($part, 'YYYY'), '_', TO_CHAR($part, 'Q'))";
			case 'WEEK_NUMBER_0':
			case 'WEEK_NUMBER':
			case 'WEEK_NUMBER_1':
				// Monday week-start not implemented.
				return "TO_CHAR($part, 'IW')::INTEGER";
			case 'HOUR_NUMBER':
			case 'HOUR':
				return "EXTRACT(HOUR FROM $part)";
			case 'MINUTE_NUMBER':
			case 'MINUTE':
				return "EXTRACT(MINUTE FROM $part)";
			case 'SECOND_NUMBER':
			case 'SECOND':
				return "FLOOR(EXTRACT(SECOND FROM $part))";
			case 'DATE_NUMBER':
			case 'DAYOFMONTH':
				return "EXTRACT(DAY FROM $part)";
			case 'DAYOFWEEK_NUMBER':
			case 'DAYOFWEEK':
				return "EXTRACT(DOW FROM $part)";
			case 'MONTH_NUMBER':
				return "EXTRACT(MONTH FROM $part)";
			case 'YEAR_NUMBER':
			case 'YEAR':
				return "EXTRACT(YEAR FROM $part)";
			case 'QUARTER_NUMBER':
				return "EXTRACT(QUARTER FROM $part)";
		}

		if (str_starts_with($function, 'TIMESTAMPDIFF_')) {
			$from = $argumentPartList[0] ?? $this->quote(0);
			$to = $argumentPartList[1] ?? $this->quote(0);

			switch ($function) {
				case 'TIMESTAMPDIFF_YEAR':
					return "EXTRACT(YEAR FROM $to - $from)";
				case 'TIMESTAMPDIFF_MONTH':
					// Second fix
					return "EXTRACT(MONTH FROM $to - $from)";
				case 'TIMESTAMPDIFF_WEEK':
					return "FLOOR(EXTRACT(DAY FROM $to - $from) / 7)";
				case 'TIMESTAMPDIFF_DAY':
					return "EXTRACT(DAY FROM ($to) - $from)";
				case 'TIMESTAMPDIFF_HOUR':
					return "EXTRACT(HOUR FROM $to - $from)";
				case 'TIMESTAMPDIFF_MINUTE':
					return "EXTRACT(MINUTE FROM $to - $from)";
				case 'TIMESTAMPDIFF_SECOND':
					return "FLOOR(EXTRACT(SECOND FROM $to - $from))";
			}
		}

		return parent::getFunctionPart(
			$function,
			$part,
			$params,
			$entityType,
			$distinct,
			$argumentPartList
		);
	}

}
