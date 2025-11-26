import type Metadata from 'espocrm/src/metadata';
import type User from 'espocrm/src/models/user';
import type Model from 'espocrm/src/model';

interface FieldStyle {
	backgroundColor?: string;
	color?: string;
	border?: string;
	borderRadius?: string;
	fontWeight?: string;
	fontStyle?: string;
	textDecoration?: string;
	boxShadow?: string;
	className?: string;
	customCss?: Record<string, string>;
}

interface HighlightingRule {
	conditionGroup?: unknown;
	layouts?: string[] | null;
	negateLayouts?: boolean;
	fieldList?: string[];
	priority?: number;
	style?: {
		cell?: FieldStyle | null;
		field?: FieldStyle | null;
	};
}

interface StyleData {
	element: JQuery;
	style: Record<string, string | undefined>;
	className?: string;
}

interface ViewWithDynamicLogic {
	model: Model;
	dynamicLogic?: {
		checkConditionGroup(conditionGroup: unknown): boolean;
	};
	layoutName?: string;
	options?: {
		layoutName?: string;
		detailLayout?: string;
		name?: string;
	};
	type?: string;
	name?: string;
	getParentView?(): ViewWithDynamicLogic | null;
}

interface FieldView {
	name: string;
	$el: JQuery;
	mode: string;
	getParentView?(): ViewWithDynamicLogic | null;
}

interface RecordView {
	getFieldViews?(): Record<string, FieldView>;
}

define(
	['dynamic-logic'],
	() => class FieldHighlighter {
		metadata: Metadata;
		user: User;
		appliedStyles: Map<string, StyleData[]>;

		static styles = {
			success: { backgroundColor: '#dff0d8', color: '#3c763d' },
			warning: { backgroundColor: '#fcf8e3', color: '#8a6d3b' },
			danger: { backgroundColor: '#f2dede', color: '#a94442' },
			info: { backgroundColor: '#d9edf7', color: '#31708f' },
			primary: { backgroundColor: '#337ab7', color: '#ffffff' },
		};

		constructor(metadata: Metadata, user: User) {
			this.metadata = metadata;
			this.user = user;
			this.appliedStyles = new Map();
		}

		isRuleApplicableToLayout(rule: HighlightingRule, layoutName: string | null): boolean {
			if (!rule.layouts || rule.layouts === null) {
				return true;
			}

			const isInLayoutsList = rule.layouts.includes(layoutName!);

			if (rule.negateLayouts === true) {
				return !isInLayoutsList;
			}

			return isInLayoutsList;
		}

		getHighlightingRules(entityType: string, fieldName: string | null = null, layoutName: string | null = null): HighlightingRule[] {
			const globalRules = (this.metadata.get(['colorizationDefs', 'Global', 'fieldRules']) || []) as HighlightingRule[];
			const entityRules = (this.metadata.get(['colorizationDefs', entityType, 'fieldRules']) || []) as HighlightingRule[];

			const allRules = [...globalRules, ...entityRules];

			const applicableRules = allRules.filter(rule => {
				if (fieldName) {
					const hasMatchingAttribute = this.ruleTargetsField(rule, fieldName);
					if (!hasMatchingAttribute) {
						return false;
					}
				}

				return this.isRuleApplicableToLayout(rule, layoutName);
			});

			return applicableRules.sort((a, b) => {
				const priorityA = a.priority || 0;
				const priorityB = b.priority || 0;
				return priorityB - priorityA;
			});
		}

		ruleTargetsField(rule: HighlightingRule, fieldName: string): boolean {
			if (rule.fieldList && Array.isArray(rule.fieldList)) {
				return rule.fieldList.includes(fieldName);
			}

			if (!rule.conditionGroup) return false;

			return this.conditionGroupReferencesField(rule.conditionGroup, fieldName);
		}

		conditionGroupReferencesField(conditionGroup: unknown, fieldName: string): boolean {
			if (Array.isArray(conditionGroup)) {
				return conditionGroup.some(condition =>
					this.conditionGroupReferencesField(condition, fieldName),
				);
			}

			if (typeof conditionGroup === 'object' && conditionGroup !== null) {
				const cg = conditionGroup as Record<string, unknown>;
				if (cg.attribute === fieldName) {
					return true;
				}

				if (cg.value && Array.isArray(cg.value)) {
					return cg.value.some(subCondition =>
						this.conditionGroupReferencesField(subCondition, fieldName),
					);
				}

				if (cg.conditionGroup) {
					return this.conditionGroupReferencesField(cg.conditionGroup, fieldName);
				}
			}

			return false;
		}

		getWatchedFields(entityType: string): string[] {
			const watchedFields = new Set<string>();

			const globalRules = (this.metadata.get(['colorizationDefs', 'Global', 'fieldRules']) || []) as HighlightingRule[];
			globalRules.forEach(rule => {
				this.extractFieldReferencesFromRule(rule, watchedFields);
			});

			const entityRules = (this.metadata.get(['colorizationDefs', entityType, 'fieldRules']) || []) as HighlightingRule[];
			entityRules.forEach(rule => {
				this.extractFieldReferencesFromRule(rule, watchedFields);
			});

			return Array.from(watchedFields);
		}

		extractFieldReferencesFromRule(rule: HighlightingRule, fieldsSet: Set<string>): void {
			if (rule.fieldList && Array.isArray(rule.fieldList)) {
				rule.fieldList.forEach(field => fieldsSet.add(field));
			}

			if (!rule.conditionGroup) return;

			this.extractFieldReferencesFromConditionGroup(rule.conditionGroup, fieldsSet);
		}

		extractFieldReferencesFromConditionGroup(conditionGroup: unknown, fieldsSet: Set<string>): void {
			if (Array.isArray(conditionGroup)) {
				conditionGroup.forEach(condition => {
					this.extractFieldReferencesFromConditionGroup(condition, fieldsSet);
				});
				return;
			}

			if (typeof conditionGroup === 'object' && conditionGroup !== null) {
				const cg = conditionGroup as Record<string, unknown>;
				if (cg.attribute) {
					fieldsSet.add(cg.attribute as string);
				}

				if (cg.data && (cg.data as Record<string, unknown>).field) {
					fieldsSet.add((cg.data as Record<string, unknown>).field as string);
				}

				if (cg.value && Array.isArray(cg.value)) {
					cg.value.forEach(subCondition => {
						this.extractFieldReferencesFromConditionGroup(subCondition, fieldsSet);
					});
				}

				if (cg.conditionGroup) {
					this.extractFieldReferencesFromConditionGroup(cg.conditionGroup, fieldsSet);
				}
			}
		}

		matchesCondition(model: Model, rule: HighlightingRule, view: ViewWithDynamicLogic | null = null): boolean {
			if (!rule.conditionGroup) {
				return false;
			}

			if (view && view.dynamicLogic && typeof view.dynamicLogic.checkConditionGroup === 'function') {
				const originalModel = view.model;
				view.model = model;

				try {
					return view.dynamicLogic.checkConditionGroup(rule.conditionGroup);
				} finally {
					view.model = originalModel;
				}
			}

			return false;
		}

		getFieldStyle(model: Model, entityType: string, fieldName: string, view: ViewWithDynamicLogic | null = null, layoutName: string | null = null): { cell: FieldStyle | null; field: FieldStyle | null } | null {
			const rules = this.getHighlightingRules(entityType, fieldName, layoutName);

			for (const rule of rules) {
				const matches = this.matchesCondition(model, rule, view);

				if (matches) {
					if (rule.style) {
						return {
							cell: rule.style.cell || null,
							field: rule.style.field || null,
						};
					}
				}
			}

			return null;
		}

		applyStyleToElement($element: JQuery, style: FieldStyle, uniqueId: string): void {
			if (!$element || !$element.length || !style) {
				return;
			}

			this.clearElementStyles($element, uniqueId);

			const styleConfig: Record<string, string | undefined> = {
				backgroundColor: style.backgroundColor,
				color: style.color,
				border: style.border,
				borderRadius: style.borderRadius,
				fontWeight: style.fontWeight,
				fontStyle: style.fontStyle,
				textDecoration: style.textDecoration,
				boxShadow: style.boxShadow,
				...style.customCss,
			};

			if (style.className) {
				$element.addClass(style.className);
			}

			Object.keys(styleConfig).forEach(property => {
				if (styleConfig[property] !== undefined && styleConfig[property] !== null) {
					$element.css(property, styleConfig[property]!);
				}
			});

			if (!this.appliedStyles.has(uniqueId)) {
				this.appliedStyles.set(uniqueId, []);
			}
			this.appliedStyles.get(uniqueId)!.push({
				element: $element,
				style: styleConfig,
				className: style.className,
			});
		}

		clearElementStyles($element: JQuery, uniqueId: string): void {
			if (!this.appliedStyles.has(uniqueId)) {
				return;
			}

			const styles = this.appliedStyles.get(uniqueId)!;
			const remainingStyles: StyleData[] = [];

			styles.forEach(styleData => {
				if (styleData.element.is($element)) {
					if (styleData.className) {
						styleData.element.removeClass(styleData.className);
					}

					Object.keys(styleData.style).forEach(property => {
						styleData.element.css(property, '');
					});
				} else {
					remainingStyles.push(styleData);
				}
			});

			if (remainingStyles.length > 0) {
				this.appliedStyles.set(uniqueId, remainingStyles);
			} else {
				this.appliedStyles.delete(uniqueId);
			}
		}

		getLayoutName(view: ViewWithDynamicLogic | null): string | null {
			if (!view) return null;

			if (view.layoutName) {
				return view.layoutName;
			}

			if (view.options && view.options.layoutName) {
				return view.options.layoutName;
			}

			if (view.options && view.options.detailLayout) {
				return view.options.detailLayout;
			}

			if (view.name === 'compare' || (view.options && view.options.name === 'compare')) {
				return 'compare';
			}

			if (view.type === 'detail' || view.name === 'detail') {
				if (view.options && view.options.detailLayout) {
					return view.options.detailLayout;
				}
				return 'detail';
			}

			if (view.type === 'edit' || view.name === 'edit') {
				return 'edit';
			}

			if (view.type === 'list' || view.name === 'list') {
				return 'list';
			}

			const parentView = view.getParentView ? view.getParentView() : null;
			if (parentView && parentView !== view) {
				return this.getLayoutName(parentView);
			}

			return null;
		}

		removeAllHighlightingClasses($element: JQuery): void {
			if (!$element || !$element.length) {
				return;
			}

			const classNames = $element.attr('class');
			if (!classNames) {
				return;
			}

			const classList = classNames.split(/\s+/);
			classList.forEach(className => {
				if (className.startsWith('field-highlight')) {
					$element.removeClass(className);
				}
			});
		}

		clearFieldHighlighting(fieldView: FieldView, _model: Model, _entityType: string, _parentView: ViewWithDynamicLogic | null = null): void {
			if (!fieldView || !fieldView.$el) {
				return;
			}

			this.clearAllHighlightingRecursively(fieldView.$el);

			const $cell = fieldView.$el.closest('.cell');
			if ($cell.length) {
				$cell.removeClass('field-cell-highlighted');
				this.removeAllHighlightingClasses($cell);
			}
		}

		clearAllHighlightingRecursively($element: JQuery): void {
			$element.removeClass('field-highlighted field-highlighted-wrapper');
			this.removeAllHighlightingClasses($element);

			$element.find('*').each((_index, child) => {
				const $child = $(child);
				$child.removeClass('field-highlighted field-highlighted-wrapper');
				this.removeAllHighlightingClasses($child);
			});
		}

		applyFieldHighlighting(fieldView: FieldView, model: Model, entityType: string, parentView: ViewWithDynamicLogic | null = null, layoutName: string | null = null): void {
			if (!fieldView || !fieldView.name || !fieldView.$el || !model) {
				return;
			}

			const fieldName = fieldView.name;

			const view = parentView || (fieldView.getParentView ? fieldView.getParentView() : null);

			const contextLayoutName = layoutName || this.getLayoutName(view);

			this.clearFieldHighlighting(fieldView, model, entityType, parentView);

			const style = this.getFieldStyle(model, entityType, fieldName, view, contextLayoutName);

			if (style) {
				this.applyFieldHighlightingSafely(fieldView, style);
			}
		}

		applyFieldHighlightingSafely(fieldView: FieldView, style: { cell: FieldStyle | null; field: FieldStyle | null }): void {
			if (!fieldView || !fieldView.$el || !style) {
				return;
			}

			if (style.field && style.field.className) {
				this.applyFieldLevelHighlighting(fieldView, style.field);
			}

			if (style.cell && style.cell.className) {
				this.applyCellLevelHighlighting(fieldView, style.cell);
			}
		}

		applyFieldLevelHighlighting(fieldView: FieldView, fieldStyle: FieldStyle): void {
			const $targetElement = this.findBestTargetElement(fieldView);

			if ($targetElement && $targetElement.length) {
				$targetElement.addClass('field-highlighted');
				if (fieldStyle.className) {
					$targetElement.addClass(fieldStyle.className);
				}
			} else {
				fieldView.$el.addClass('field-highlighted');
				if (fieldStyle.className) {
					fieldView.$el.addClass(fieldStyle.className);
				}
			}
		}

		findBestTargetElement(fieldView: FieldView): JQuery {
			const mode = fieldView.mode;

			if (mode === 'detail') {
				const displayElements = fieldView.$el.find('.numeric-text, .text-value, .display-value, .value-text');
				if (displayElements.length) {
					return displayElements.first();
				}

				const contentSpans = fieldView.$el.find('span').filter(function () {
					return $(this).text().trim().length > 0 && !$(this).children().length;
				});
				if (contentSpans.length) {
					return contentSpans.first();
				}
			}

			if (mode === 'edit') {
				const $mainInput = fieldView.$el.find('input.main-element, select.main-element, textarea.main-element');
				if ($mainInput.length) {
					return $mainInput;
				}

				const $anyInput = fieldView.$el.find('input, select, textarea').first();
				if ($anyInput.length) {
					return $anyInput;
				}
			}

			return fieldView.$el;
		}

		applyCellLevelHighlighting(fieldView: FieldView, cellStyle: FieldStyle): void {
			const $cell = fieldView.$el.closest('.cell');
			if ($cell.length) {
				$cell.addClass('field-cell-highlighted');
				if (cellStyle.className) {
					$cell.addClass(cellStyle.className);
				}
			} else {
				fieldView.$el.addClass('field-cell-highlighted');
				if (cellStyle.className) {
					fieldView.$el.addClass(cellStyle.className);
				}
			}
		}

		applyRecordHighlighting(recordView: RecordView & ViewWithDynamicLogic, model: Model, entityType: string): void {
			if (!recordView || !model) {
				return;
			}

			const fieldViews = recordView.getFieldViews ? recordView.getFieldViews() : {};

			const layoutName = this.getLayoutName(recordView);

			Object.keys(fieldViews).forEach(fieldName => {
				const fieldView = fieldViews[fieldName];
				this.applyFieldHighlighting(fieldView, model, entityType, recordView, layoutName);
			});
		}

		static createRule(conditionGroup: unknown, style: { cell?: FieldStyle | null; field?: FieldStyle | null }, priority = 0, fieldList: string[] | null = null): HighlightingRule {
			const rule: HighlightingRule = {
				conditionGroup,
				style: {
					cell: style.cell || null,
					field: style.field || null,
				},
				priority,
			};

			if (fieldList && Array.isArray(fieldList)) {
				rule.fieldList = fieldList;
			}

			return rule;
		}

		static createCellFieldRule(conditionGroup: unknown, cellStyle: FieldStyle | null = null, fieldStyle: FieldStyle | null = null, priority = 0, fieldList: string[] | null = null): HighlightingRule {
			const rule: HighlightingRule = {
				conditionGroup,
				style: {
					cell: cellStyle,
					field: fieldStyle,
				},
				priority,
			};

			if (fieldList && Array.isArray(fieldList)) {
				rule.fieldList = fieldList;
			}

			return rule;
		}

		static createColorStyle(color: string, options: Partial<FieldStyle> & { textColor?: string } = {}): FieldStyle {
			return {
				backgroundColor: color,
				color: options.textColor || FieldHighlighter.getContrastingColor(color),
				border: options.border || `1px solid ${color}`,
				borderRadius: options.borderRadius || '4px',
				...options,
			};
		}

		static getContrastingColor(backgroundColor: string): string {
			if (backgroundColor.startsWith('#')) {
				const r = parseInt(backgroundColor.substr(1, 2), 16);
				const g = parseInt(backgroundColor.substr(3, 2), 16);
				const b = parseInt(backgroundColor.substr(5, 2), 16);
				const brightness = (r * 299 + g * 587 + b * 114) / 1000;
				return brightness > 128 ? '#000000' : '#ffffff';
			}
			return '#000000';
		}
	},
);
