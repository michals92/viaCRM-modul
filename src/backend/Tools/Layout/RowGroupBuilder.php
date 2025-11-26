<?php

namespace Espo\Modules\Viacrm\Tools\Layout;

use Espo\Core\InjectableFactory;

class RowGroupBuilder {
	/** @var array<array<string, mixed>|bool> $rows */
	protected array $rows;

	protected int $index;

	protected ?SectionBuilder $sectionBuilder = null;

	protected ?LayoutBuilder $layoutBuilder = null;

	public function __construct(
		protected readonly InjectableFactory $injectableFactory
	) {}

	public function withLayoutBuilder(LayoutBuilder $layoutBuilder): self {
		$this->layoutBuilder ??= $layoutBuilder;

		return $this;
	}

	public function withSectionBuilder(SectionBuilder $sectionBuilder): self {
		$this->sectionBuilder ??= $sectionBuilder;
		$this->withLayoutBuilder($this->sectionBuilder->getLayoutBuilder());

		return $this;
	}

	/**
	 * @param array<array<string, mixed>|bool> $rows
	 */
	public function &setRows(array &$rows): self {
		$this->rows = &$rows;

		return $this;
	}

	public function setIndex(int $index): self {
		$this->index = $index;

		return $this;
	}

	public function build(): SectionBuilder|LayoutBuilder {
		if ($this->sectionBuilder !== null) {
			return $this->sectionBuilder;
		}

		return $this->getLayoutBuilder();
	}

	public function isFull(): bool {
		return count($this->rows) >= 4 && $this->getLayoutBuilder()->getType()->hasGroups();
	}

	public function addRow(bool $empty = false): RowBuilder {
		$row = $empty ? false : [];

		if ($this->sectionBuilder && $this->isFull()) {
			return $this->sectionBuilder->getRowsGroup($this->index + 1)->addRow();
		}

		$this->rows[] = &$row;

		return $this->injectableFactory->createWith(RowBuilder::class, ['rowGroupBuilder' => $this])->setRow($row);
	}

	public function getLayoutBuilder(): LayoutBuilder {
		if ($this->sectionBuilder) {
			return $this->sectionBuilder->getLayoutBuilder();
		}

		assert($this->layoutBuilder !== null);

		return $this->layoutBuilder;
	}
}