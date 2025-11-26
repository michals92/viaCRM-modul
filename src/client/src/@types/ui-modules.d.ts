/**
 * UI module type definitions for AMD dependencies
 * These are shared across extension files to avoid duplicate declarations
 */

/**
 * ui/select module
 */
export type UiSelectModule = {
	init(element: JQuery, options: UiSelectOptions): void;
};

export type UiSelectOptions = {
	matchAnyWord?: boolean;
	sortBy?: string;
	sortDirection?: string;
	score?: (search: string, item: { value: string }) => number;
	load?: (item: string, callback: (items: UiSelectItem[]) => void) => void;
};

export type UiSelectItem = {
	value: string;
	text?: string;
};

/**
 * ui/multi-select module
 */
export type UiMultiSelectModule = {
	init(element: JQuery, options: UiMultiSelectOptions): void;
};

export type UiMultiSelectOptions = {
	items: Array<{ value: string; text: string }>;
	delimiter: string;
	matchAnyWord: boolean;
};

/**
 * Helper mixins
 */
export type FieldAutoFillMixin = {
	setupAutoFill(): void;
};
