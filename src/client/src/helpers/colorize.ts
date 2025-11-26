import type Metadata from 'espocrm/src/metadata';
import type User from 'espocrm/src/models/user';
import type Model from 'espocrm/src/model';
import type DynamicLogicType from 'espocrm/src/dynamic-logic';

interface ColorizationRule {
	conditionGroup?: unknown;
	color?: string;
}

interface ViewWithHelper {
	getHelper(): unknown;
}

define(
	['dynamic-logic'],
	(DynamicLogic: typeof DynamicLogicType) => class ColorizeHelper {
		metadata: Metadata;
		user: User;

		constructor(metadata: Metadata, user: User) {
			this.metadata = metadata;
			this.user = user;
		}

		getColor(model: Model, entityType: string, view: ViewWithHelper): string | null {
			const rules = (this.metadata.get(['colorizationDefs', entityType, 'rules']) || []) as ColorizationRule[];

			for (const rule of rules) {
				if (!rule.conditionGroup || !rule.color) {
					continue;
				}

				const dynamicLogic = new DynamicLogic(
					{},
					{
						model: model,
						getUser: () => this.user,
						getHelper: () => view.getHelper(),
					},
				);

				const result = dynamicLogic.checkConditionGroup(rule.conditionGroup);

				if (result) {
					return rule.color;
				}
			}

			return null;
		}

		applyColorToRow($row: JQuery, color: string | null, modelId: string): void {
			const styleEl = document.getElementById('colorize-style-' + modelId);
			if (styleEl) styleEl.remove();

			if (color) {
				if ($row && $row.length) {
					$row.each(function () {
						this.style.setProperty('background-color', color, 'important');
					});

					$row.find('td').each(function () {
						this.style.setProperty('background-color', color, 'important');
					});

					const style = document.createElement('style');
					style.id = 'colorize-style-' + modelId;
					style.innerHTML =
						'table.table > tbody > tr[data-id="' +
						modelId +
						'"] > td { background-color: ' +
						color +
						' !important; }';
					document.head.appendChild(style);
				}
			} else {
				if ($row && $row.length) {
					$row.each(function () {
						this.style.removeProperty('background-color');
					});

					$row.find('td').each(function () {
						this.style.removeProperty('background-color');
					});
				}
			}
		}

		getWatchedFields(entityType: string): string[] {
			const watchedFields = new Set<string>();
			const rules = (this.metadata.get(['colorizationDefs', entityType, 'rules']) || []) as ColorizationRule[];

			rules.forEach(rule => {
				if (rule.conditionGroup) {
					this.extractFieldReferencesFromConditionGroup(rule.conditionGroup, watchedFields);
				}
			});

			return Array.from(watchedFields);
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

		applyColorsToRows(view: ViewWithHelper & { el: HTMLElement; getView(id: string): { $el: JQuery } | undefined }, collection: { models: Array<{ id: string }> } | null, entityType: string): void {
			if (!collection) {
				return;
			}

			collection.models.forEach(model => {
				const color = this.getColor(model as Model, entityType, view);

				const rowView = view.getView(model.id);
				let $row: JQuery;

				if (rowView && rowView.$el) {
					$row = rowView.$el;
				} else {
					$row = $(view.el).find('tr[data-id="' + model.id + '"]');
				}

				if ($row && $row.length) {
					this.applyColorToRow($row, color, model.id);
				}
			});
		}
	},
);
