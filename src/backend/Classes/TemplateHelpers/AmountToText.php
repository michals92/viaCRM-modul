<?php

namespace Espo\Modules\Viacrm\Classes\TemplateHelpers;

use Espo\Core\Htmlizer\Helper;
use Espo\Core\Htmlizer\Helper\Data;
use Espo\Core\Htmlizer\Helper\Result;

class AmountToText implements Helper {
	public function render(Data $data): Result {
		$value = $data->getArgumentList()[0] ?? null;
		$number = (int)$value;

		if ($number == 0) {
			return Result::createSafeString('nula');
		}
    
		$minus = '';
		if ($number < 0) {
			$minus = 'mínus ';
			$number = -$number;
		}
    
		$units = [
		    0 => '',
		    1 => 'jeden',
		    2 => 'dva',
		    3 => 'tři',
		    4 => 'čtyři',
		    5 => 'pět',
		    6 => 'šest',
		    7 => 'sedm',
		    8 => 'osm',
		    9 => 'devět',
		    10 => 'deset',
		    11 => 'jedenáct',
		    12 => 'dvanáct',
		    13 => 'třináct',
		    14 => 'čtrnáct',
		    15 => 'patnáct',
		    16 => 'šestnáct',
		    17 => 'sedmnáct',
		    18 => 'osmnáct',
		    19 => 'devatenáct'
		];
    
		$tens = [
		    2 => 'dvacet',
		    3 => 'třicet',
		    4 => 'čtyřicet',
		    5 => 'padesát',
		    6 => 'šedesát',
		    7 => 'sedmdesát',
		    8 => 'osmdesát',
		    9 => 'devadesát'
		];
    
		$hundreds = [
		    0 => '',
		    1 => 'sto',
		    2 => 'dvě stě',
		    3 => 'tři sta',
		    4 => 'čtyři sta',
		    5 => 'pět set',
		    6 => 'šest set',
		    7 => 'sedm set',
		    8 => 'osm set',
		    9 => 'devět set'
		];
    
		$mega = [
		    ['', '', '', 'm'],
		    ['tisíc', 'tisíce', 'tisíc', 'm'],
		    ['milion', 'miliony', 'milionů', 'm'],
		    ['miliarda', 'miliardy', 'miliard', 'f'],
		    ['bilion', 'biliony', 'bilionů', 'm'],
		    ['biliarda', 'biliardy', 'biliard', 'f'],
		    ['trilion', 'triliony', 'trilionů', 'm'],
		    ['triliarda', 'triliardy', 'triliard', 'f'],
		];
    
		$numberStr = str_pad((string) $number, (int) ceil(strlen((string) $number) / 3) * 3, '0', STR_PAD_LEFT);
		$groups = str_split($numberStr, 3);
    
		$words = [];
		$groupCount = count($groups);
    
		foreach ($groups as $pos => $group) {
			$groupNum = (int)$group;
			if ($groupNum == 0) {
				$groupCount--;
				continue;
			}
    
			$h = (int)($group[0]);
			$t = (int)($group[1]);
			$u = (int)($group[2]);
    
			$gender = $mega[$groupCount - 1][3];
			$groupWords = '';
    
			// Handle hundreds
			if ($h > 0) {
				$groupWords .= $hundreds[$h];
			}
    
			// Handle tens and units
			if ($t == 1) {
				// Numbers 10-19 are special cases
				$groupWords .= ($h > 0 ? ' ' : '') . $units[$t * 10 + $u];
			} elseif ($t > 1) {
				// Numbers 20-99
				$groupWords .= ($h > 0 ? ' ' : '') . $tens[$t];
				// Add units if present
				if ($u > 0) {
					if ($u == 1 && $gender == 'f' && $groupCount == 1) {
						$groupWords .= ' jedna';
					} elseif ($u == 2 && $gender == 'f' && $groupCount == 1) {
						$groupWords .= ' dvě';
					} elseif ($u == 2 && $gender == 'n' && $groupCount == 1) {
						$groupWords .= ' dvě';
					} else {
						$groupWords .= ' ' . $units[$u];
					}
				}
			} else {
				// Just units (0-9)
				if ($u > 0) {
					$unitWord = '';
                    
					// Handle gender-specific forms for 1 and 2
					if ($u == 1) {
						if ($gender == 'f') {
							$unitWord = 'jedna';
						} 
						// @phpstan-ignore-next-line Condition might be false when $gender can be 'n'
						else if ($gender == 'n') {
							$unitWord = 'jedno';
						} else {
							$unitWord = 'jeden';
						}
					} elseif ($u == 2) {
						if ($gender == 'f') {
							$unitWord = 'dvě';
						} 
						// @phpstan-ignore-next-line Condition might be false when $gender can be 'n'
						else if ($gender == 'n') {
							$unitWord = 'dvě';
						} else {
							$unitWord = 'dva';
						}
					} else {
						$unitWord = $units[$u];
					}
                    
					// h and t are always >= 0, so the comparison operation is rewritten
					$groupWords .= (($h != 0 || $t != 0) ? ' ' : '') . $unitWord;
				}
			}
    
			// Add appropriate suffix based on the number
			$groupForm = '';
			$lastTwoDigits = $groupNum % 100;
			$lastDigit = $groupNum % 10;
    
			if ($lastTwoDigits >= 11 && $lastTwoDigits <= 14) {
				$groupForm = $mega[$groupCount - 1][2];
			} elseif ($lastDigit == 1) {
				$groupForm = $mega[$groupCount - 1][0];
			} elseif ($lastDigit >= 2 && $lastDigit <= 4) {
				$groupForm = $mega[$groupCount - 1][1];
			} else {
				$groupForm = $mega[$groupCount - 1][2];
			}
    
			if ($groupCount > 1 && $groupForm != '') {
				$groupWords .= ' ' . $groupForm;
			}
    
			if ($groupWords !== '') {
				$words[] = $groupWords;
			}
			$groupCount--;
		}

		return Result::createSafeString(
			$minus . implode(' ', $words)
		);
	}
}