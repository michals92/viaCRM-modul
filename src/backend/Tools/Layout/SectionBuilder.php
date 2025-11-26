<?php

namespace Espo\Modules\Viacrm\Tools\Layout;

use Espo\Core\InjectableFactory;
use Espo\Modules\Viacrm\Core\Layout\LikeType;

class SectionBuilder
{
	/** @var array<string, mixed> */
	protected array $section;

	public function __construct(
		protected readonly LayoutBuilder $layoutBuilder,
		protected readonly InjectableFactory $injectableFactory
	) {
	}

	/**
	 * @param array<string, mixed> $section
	 * */
	public function &setSection(array &$section): self
	{
		$this->section = &$section;

		return $this;
	}

	/**
	 * @param string|null                $tabLabel     @deprecated *DO NOT USE ANYMORE, IN THE PROCESS OF BEING DEPRECATED IN FAVOR OF LABEL*
	 * @param null|array<string, string> $translations (key - language shortcode, value - translation)
	 *
	 * @deprecated
	 */
	public function toggleTab(?string $tabLabel = null, ?array $translations = null, ?bool $status = null): self
	{
		if ($this->layoutBuilder->getType() !== LikeType::detail) {
			return $this;
		}

		$status ??= !($this->section['tabBreak'] ?? false);
		$tabLabel = $this->section['label'] ?? $tabLabel;
		if ($tabLabel) {
			$this->getLayoutBuilder()->addTranslationFromArray('labels', $tabLabel, $translations);
			if (!str_starts_with($tabLabel, '$label:')) {
				$tabLabel = '$label:' . $tabLabel;
			}
		}

		$this->section['tabBreak'] = $status;
		$tabLabel && $this->section['tabLabel'] = $tabLabel;

		return $this;
	}

	/**
	 * @deprecated
	 */
	public function setTab(?string $tabLabel): self
	{
		return $this->toggleTab($tabLabel, null, true);
	}

	public function setStyle(string $style = 'info' | 'warning' | 'danger'): self
	{
		if ($this->layoutBuilder->getType() !== LikeType::detail) {
			return $this;
		}
		$this->section['style'] = $style;

		return $this;
	}

	/**
	 * @param null|array<string, string> $translations (key - language shortcode, value - translation)
	 */
	public function setNoteText(?string $noteText, ?array $translations = null): self
	{
		if ($this->layoutBuilder->getType() !== LikeType::detail) {
			return $this;
		}
		if ($noteText) {
			$this->getLayoutBuilder()->addTranslationFromArray('panelNotes', $noteText, $translations);
			$noteText = '$' . $noteText;
		}

		$this->section['noteText'] = $noteText;

		return $this;
	}

	/**
	 * @param null|array<string, string> $translations (key - language shortcode, value - translation)
	 */
	public function setCustomLabel(string $customLabel, ?array $translations = null): self
	{
		if (!$this->layoutBuilder->getType()->hasCustomLabel()) {
			return $this;
		}

		$this->getLayoutBuilder()->addTranslationFromArray('panelCustomLabels', $customLabel, $translations);

		$this->section['customLabel'] = $customLabel;

		return $this;
	}

	/**
	 * @return array<array<string, mixed>>
	 */
	public function &getRows(): array
	{
		$this->section['rows'] ??= [];

		return $this->section['rows'];
	}

	public function getRowsGroup(int $index): RowGroupBuilder
	{
		$this->getRows()[$index] ??= [];

		return $this->injectableFactory->create(RowGroupBuilder::class)
			->withSectionBuilder($this)
			->setRows($this->getRows()[$index])
			->setIndex($index);
	}

	/**
	 * Inserts a field row at a specific position.
	 * Automatically checks if fields already exist to prevent duplicates.
	 *
	 * @param int                        $position     The position where to insert the row (0-based index)
	 * @param string                     $field1       The name of the first field
	 * @param string|null                $field2       The name of the second field (or null for empty)
	 * @param array<string, string>|null $translations Optional translations
	 *
	 * @return self
	 */
	public function insertFieldsAt(int $position, string $field1, ?string $field2 = null, ?array $translations = null): self
	{
		// Check if field1 already exists
		if ($this->hasField($field1)) {
			return $this;
		}

		// Check if field2 already exists (if provided)
		if ($field2 !== null && $this->hasField($field2)) {
			return $this;
		}

		$rows = &$this->getRows();

		$row = [['name' => $field1]];
		if ($field2 !== null) {
			$row[] = ['name' => $field2];
		} else {
			$row[] = false;
		}

		// Přidání překladů, pokud jsou poskytnuty
		if ($translations) {
			$this->getLayoutBuilder()->addTranslationFromArray('fields', $field1, $translations);
			if ($field2 !== null) {
				$this->getLayoutBuilder()->addTranslationFromArray('fields', $field2, $translations);
			}
		}

		array_splice($rows, $position, 0, [$row]);

		return $this;
	}

	/**
	 * Checks if section contains a field with given name.
	 *
	 * @param string $fieldName Field name to check
	 *
	 * @return bool
	 */
	public function hasField(string $fieldName): bool
	{
		if (!isset($this->section['rows'])) {
			return false;
		}

		// Check nested structure created by RowGroupBuilder
		foreach ($this->section['rows'] as $rowGroup) {
			if (!is_array($rowGroup)) {
				continue;
			}

			// Check if rowGroup contains rows array (nested structure)
			if (isset($rowGroup[0]) && is_array($rowGroup[0])) {
				// This is a nested row structure
				foreach ($rowGroup as $row) {
					if (is_array($row) && isset($row['name']) && $row['name'] === $fieldName) {
						return true;
					}
				}
			} else {
				// This is a direct row (backward compatibility)
				if (isset($rowGroup['name']) && $rowGroup['name'] === $fieldName) {
					return true;
				}
			}
		}

		return false;
	}

	public function build(): LayoutBuilder
	{
		return $this->layoutBuilder;
	}

	public function getLayoutBuilder(): LayoutBuilder
	{
		return $this->layoutBuilder;
	}
}
