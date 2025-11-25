<?php

namespace Espo\Modules\Viacrm\Tools\Layout;

use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Language;
use Espo\Core\WebSocket\Submission as WebSocketSubmission;
use Espo\Entities\User;
use Espo\Modules\Viacrm\Core\Layout;

class LayoutBuilder {

	protected readonly string $layoutName;

	protected readonly string $scope;

	protected Layout\LikeType $type;

	protected ?RowGroupBuilder $rowGroupBuilder = null;

	/** @var array<array<string, mixed>|bool> $layout */
	protected array $layout;

	/** @var array<array<string, mixed>> $translations */
	protected array $translations = [];

	public function __construct(
		string                                 $scope,
		string                                 $layoutName,
		protected readonly InjectableFactory   $injectableFactory,
		protected readonly WebSocketSubmission $webSocketSubmission,
		protected readonly User                $user,
		protected readonly Language            $language
	) {
		$this->layoutName = lcfirst($layoutName);
		$this->scope = ucfirst($scope);
	}

	/**
	 * @param array<array<string, mixed>> $layout
	 */
	public function setLayout(array &$layout): void {
		if (isset($this->layout)) {
			throw new \LogicException('Layout is already set');
		}

		$this->assertLayoutType($layout);
		$this->layout = &$layout;
	}

	/**
	 * @param array<array<string, mixed>> $layout
	 */
	public function addLayout(array $layout): self {
		$this->assertLayoutType($layout);
		$this->layout[] = $layout;

		return $this;
	}

	/**
	 * @param array<array<string, mixed>> $layout
	 */
	private function assertLayoutType(array $layout): void {
		$layoutType = Layout\LikeType::fromLayout($layout);

		if ($layoutType === null) {
			throw new \LogicException('Unsupported layout type:' . $this->layoutName . ' occured in scope:' . $this->scope);
		}

		$this->type ??= $layoutType;

		if ($layoutType !== $this->type) {
			throw new \LogicException("Can't combine multiple types of layout");
		}
	}

	public function getSection(string $labelName): ?SectionBuilder {
		if (!$this->type->hasSections()) {
			throw new \LogicException('Cannot get section from layout without sections');
		}

		foreach ($this->layout as &$section) {
			if (!is_array($section)) {
				continue;
			}
			if (
				isset($section['label']) &&
				($label = $section['label']) &&
				($label !== $labelName)
			) {
				continue;
			}
			if (!isset($section['tabLabel']) || !($tabLabel = $section['tabLabel'])) {
				continue;
			}

			if (!($tabLabel === $labelName || $tabLabel === '$label:' . $labelName)) {
				continue;
			}

			$sectionBuilder = $this->injectableFactory->createWith(SectionBuilder::class, [
				'layoutBuilder' => $this
			]);

			return $sectionBuilder->setSection($section);
		}

		return null;
	}

	/**
	 * @param array<string, mixed> $section
	 */
	public function addSection(array &$section): SectionBuilder {
		if (!$this->type->hasSections()) {
			throw new \LogicException('Cannot add section to layout without sections');
		}

		$this->layout[] = &$section;

		return $this->injectableFactory->createWith(SectionBuilder::class, ['layoutBuilder' => $this])->setSection($section);
	}

	public function getOrCreateSection(string $labelName): SectionBuilder {
		$section = $this->getSection($labelName);
		if ($section === null) {
			$newSection = [
				'label' => $labelName,
				'rows' => []
			];

			return $this->addSection($newSection);
		}

		return $section;
	}

	public function addRow(bool $empty = false): ?RowBuilder {
		$rowGroupBuilder = $this->getRowGroupBuilder();

		if ($rowGroupBuilder === null) {
			return null;
		}

		$row = $empty ? false : [];

		$this->layout[] = &$row;

		return $this->injectableFactory->createWith(RowBuilder::class, ['rowGroupBuilder' => $rowGroupBuilder])->setRow($row);
	}

	public function getRowGroupBuilder(): ?RowGroupBuilder {
		if ($this->type->hasGroups()) {
			return null;
		}
		$this->rowGroupBuilder ??= $this->injectableFactory->create(RowGroupBuilder::class)->withLayoutBuilder($this);

		return $this->rowGroupBuilder;
	}

	public function getLayoutName(): string {
		return $this->layoutName;
	}

	public function getScope(): string {
		return $this->scope;
	}

	public function getType(): Layout\LikeType {
		return $this->type;
	}

	/**
	 * @param string                     $categoryName - fields, links, tooltips etc.
	 * @param string                     $name         - warehouse, user etc.
	 * @param null|array<string, string> $translations
	 * @param null|string                $language     - language shortcode, default is $this->language->getLanguage()
	 */
	public function addTranslationFromArray(string $categoryName, string $name, ?array $translations = null, string|null $language = null): void {
		if (empty($translations)) {
			return;
		}
		$language ??= $this->language->getLanguage();
		if ($translation = $translations[$language]) {
			$this->addTranslation($categoryName, $name, $translation, $language);
		}
	}

	/**
	 * @param string      $categoryName - fields, links, tooltips etc.
	 * @param string      $name         - warehouse, user etc.
	 * @param string      $value        - sklad, uživatel etc.
	 * @param string|null $language     - language shortcode, default is $this->language->getLanguage()
	 */
	public function addTranslation(string $categoryName, string $name, string $value, string|null $language = null): void {
		$language ??= $this->language->getLanguage();
		$this->translations[$language][$this->getScope()][$categoryName][$name] = $value;
		$this->language->set($this->getScope(), $categoryName, $name, $value);
	}

	public function submitTranslationsToFrontend(): void {
		if (empty($this->translations) || $this->user->isSystem()) {
			return;
		}

		if ($translations = $this->translations[$this->language->getLanguage()]) {
			$this->language->save();
			$this->webSocketSubmission->submit(
				'viacrm.language',
				$this->user->getId(),
				(object)[
					'data' => $translations,
				]
			);
		}
	}

	/**
	 * Checks if layout contains a field with given name
	 *
	 * @param  string $fieldName Field name to check
	 * @return bool
	 */
	public function hasField(string $fieldName): bool {
		switch ($this->type) {
			case Layout\LikeType::list:
				return $this->hasFieldInListLayout($fieldName);
			case Layout\LikeType::detail:
				return $this->hasFieldInDetailLayout($fieldName);
			case Layout\LikeType::bottomsPanel:
				return $this->hasFieldInBottomsPanelLayout($fieldName);
			default:
				return false;
		}
	}

	/**
	 * Checks if list layout contains a field with given name
	 */
	private function hasFieldInListLayout(string $fieldName): bool {
		foreach ($this->layout as $field) {
			if (is_array($field) && isset($field['name']) && $field['name'] === $fieldName) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Checks if detail layout contains a field with given name
	 */
	private function hasFieldInDetailLayout(string $fieldName): bool {
		foreach ($this->layout as $section) {
			if (!is_array($section) || !isset($section['rows'])) {
				continue;
			}

			foreach ($section['rows'] as $row) {
				if (!is_array($row)) {
					continue;
				}

				if (isset($row['name']) && $row['name'] === $fieldName) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Checks if bottomsPanel layout contains a field with given name
	 */
	private function hasFieldInBottomsPanelLayout(string $fieldName): bool {
		// TODO: Implement if needed for bottomsPanel layouts
		return false;
	}

	/**
	 * Adds a field to a list layout.
	 * Automatically prevents duplicates by checking if field already exists.
	 *
	 * @param  array<string, mixed> $field Field definition with 'name' and optional properties like 'width'
	 * @return self
	 */
	public function addField(array $field): self {
		if ($this->type !== Layout\LikeType::list) {
			throw new \LogicException('Cannot add field to non-list layout');
		}

		// Check for duplicates
		if (isset($field['name']) && $this->hasField($field['name'])) {
			return $this;
		}

		$this->layout[] = $field;

		return $this;
	}

	/**
	 * Inserts a field at a specific position in a list layout.
	 * Automatically prevents duplicates by checking if field already exists.
	 *
	 * @param  array<string, mixed> $field    Field definition with 'name' and optional properties like 'width'
	 * @param  int                  $position Position where to insert the field (0-based index)
	 * @return self
	 */
	public function insertFieldAt(array $field, int $position): self {
		if ($this->type !== Layout\LikeType::list) {
			throw new \LogicException('Cannot insert field in non-list layout');
		}

		// Check for duplicates
		if (isset($field['name']) && $this->hasField($field['name'])) {
			return $this;
		}

		if ($position < 0 || $position > count($this->layout)) {
			throw new \InvalidArgumentException('Position out of bounds');
		}

		array_splice($this->layout, $position, 0, [$field]);

		return $this;
	}

	/**
	 * @return array<array<string, mixed>> A cloned layout
	 */
	public function build(): array {
		$result = (array)(clone ((object)$this->layout));

		return $result;
	}

}
