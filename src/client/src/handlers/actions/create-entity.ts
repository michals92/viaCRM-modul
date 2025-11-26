import type ActionHandler from 'espocrm/src/action-handler';
import type CreateRelatedHelperType from 'espocrm/src/helpers/record/create-related';
import type Model from 'espocrm/src/model';
import type View from 'espocrm/src/bull/view';

interface FieldDefinition {
	type: 'map' | 'static' | 'computed';
	target: string;
	source?: string;
	value?: unknown;
	fn?: (item?: unknown) => unknown;
}

interface EntityFieldsConfig {
	strategy?: 'includeAll' | 'explicit';
	exclude?: string[];
	fields?: FieldDefinition[];
}

interface RecordListConfig {
	sourceField: string;
	targetField?: string;
	strategy?: 'includeAll' | 'explicit' | 'mapped';
	exclude?: string[];
	fields?: FieldDefinition[];
	filter?: (item: unknown) => boolean;
}

interface CreateEntityOptions {
	afterSave?: (model: Model) => void;
	enableNavigation?: boolean;
	returnUrl?: string;
	returnDispatchParams?: {
		controller: string;
		action: string | null;
		options: {
			isReturn: boolean;
		};
	};
	recordLists?: Record<string, RecordListConfig>;
	entityFields?: FieldDefinition[] | EntityFieldsConfig;
}

define(
	['action-handler', 'helpers/record/create-related'],
	(Dep: typeof ActionHandler, CreateRelatedHelper: typeof CreateRelatedHelperType) => class extends Dep {
		link = '';
		enableNavigation = false;
		entityFields: FieldDefinition[] | EntityFieldsConfig | null = null;
		recordLists?: Record<string, RecordListConfig>;

		declare view: View & {
			scope: string;
			model: Model;
			translate(label: string, category: string, scope: string): string;
			getRouter(): { getCurrentUrl(): string };
		};

		isVisible(): boolean {
			return true;
		}

		actionCreateEntity(): void {
			const helper = new CreateRelatedHelper(this.view);

			const options: CreateEntityOptions = {
				afterSave: model => {
					const scope = model.entityType;
					Espo.Ui.success(this.view.translate(scope + 'Created', 'messages', scope));
					this.afterSave(this.view, model);
				},
				enableNavigation: this.enableNavigation,
			};

			if (this.enableNavigation) {
				options.returnUrl = this.view.getRouter().getCurrentUrl();
				options.returnDispatchParams = {
					controller: this.view.scope,
					action: null,
					options: {
						isReturn: true,
					},
				};
			}

			if (this.recordLists) {
				options.recordLists = this.recordLists;
			}

			if (this.entityFields) {
				options.entityFields = this.entityFields;
			}

			helper.process(this.view.model, this.link, options);
		}

		afterSave(_parentView: View, _createdModel: Model): void {}

		isVisibleForStatus(targetStatus: string): boolean {
			const currentStatus = this.view.model.get('status') as string;

			return currentStatus === targetStatus;
		}
	},
);
