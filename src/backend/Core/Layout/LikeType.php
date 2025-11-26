<?php

namespace Espo\Modules\Viacrm\Core\Layout;

enum LikeType
{
	case detail;
	case list;
	case bottomsPanel;

	public function toString(): string
	{
		return match ($this) {
			self::detail => 'detail',
			self::list => 'list',
			self::bottomsPanel => 'bottomsPanel',
		};
	}

	/**
	 * @param array<array<string, mixed>> $layout
	 */
	public static function fromLayout(array $layout): ?self
	{
		if (empty($layout)) {
			return null;
		}

		if (!array_is_list($layout)) {
			return self::bottomsPanel;
		}

		if (self::hasAnyRows($layout)) {
			return self::detail;
		}

		return self::list;
	}

	/**
	 * @param array<array<string, mixed>> $layout
	 */
	public static function hasAnyRows(array $layout): bool
	{
		// Iterate through each item in the array
		foreach ($layout as $item) {
			// Check if 'rows' key exists and is not empty
			if (is_array($item) && isset($item['rows']) && is_array($item['rows'])) {
				// Iterate through rows
				foreach ($item['rows'] as $row) {
					// If row is not false and not an empty array, return true immediately
					if (!empty($row)) {
						return true;
					}
				}
			}
		}

		return false;
	}

	public function hasCustomLabel(): bool
	{
		return $this === self::detail;
	}

	public function hasSections(): bool
	{
		return $this === self::detail;
	}

	public function hasGroups(): bool
	{
		return $this !== self::list;
	}

	public function hasRows(): bool
	{
		return $this === self::list;
	}
}
