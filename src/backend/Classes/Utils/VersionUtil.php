<?php

namespace Espo\Modules\Viacrm\Classes\Utils;

class VersionUtil {
	public static function satisfiesVersionRequirement(string $currentVersion, string $requirement): bool {
		$requirement = trim($requirement);
		$operator = substr($requirement, 0, 2);

		if (in_array($operator, ['>=', '<=', '!='])) {
			$version = substr($requirement, 2);

			return version_compare($currentVersion, $version, $operator);
		}

		$operator = $requirement[0];
		if (in_array($operator, ['>', '<', '^', '~'])) {
			$version = substr($requirement, 1);
			switch ($operator) {
				case '>':
				case '<':
					return version_compare($currentVersion, $version, $operator);
				case '^':
					$parts = explode('.', $version);
					$parts[0] = strval(intval($parts[0]) + 1);
					$upperBound = implode('.', $parts);

					return version_compare($currentVersion, $version, '>=') &&
						version_compare($currentVersion, $upperBound, '<');
				case '~':
					$parts = explode('.', $version);
					if (count($parts) === 1) {
						$parts[0] = strval(intval($parts[0]) + 1);
					} else {
						$parts[count($parts) - 1] = '*';
					}
					$upperBound = implode('.', $parts);

					return version_compare($currentVersion, $version, '>=') &&
						version_compare($currentVersion, $upperBound, '<');
			}
		}

		// Exact version match
		return version_compare($currentVersion, $requirement, '==');
	}
}