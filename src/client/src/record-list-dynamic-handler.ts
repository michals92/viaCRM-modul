import type Model from 'espocrm/src/model';
import type View from 'espocrm/src/bull/view';

interface FieldView extends View {
	setReadOnly(locked?: boolean): void;
	setNotReadOnly(): void;
	isDetailMode(): boolean;
	setEditMode(): Promise<void>;
	reRender(): Promise<void>;
	hide(): void;
	show(): void;
	isRendered(): boolean;
	once(event: string, callback: () => void): void;
}

interface RowView extends View {
	model: Model;
	getView(name: string): FieldView | undefined;
}

interface ChangeOptions {
	afterInit?: boolean;
}

define(
	[],
	() => {
		/**
		 * @memberOf module:viacrm:record-list-dynamic-handler
		 */
		class RecordListDynamicHandler {
			/**
			 * A row view.
			 *
			 * @protected
			 */
			rowView: RowView;

			/**
			 * A parent view.
			 *
			 * @protected
			 */
			parentView: View;

			/**
			 * A model.
			 *
			 * @protected
			 */
			model: Model;

			/**
			 * A parent model.
			 *
			 * @protected
			 */
			parentModel: Model;

			constructor(rowView: RowView, parentView: View, parentModel: Model) {
				this.rowView = rowView;
				this.parentView = parentView;
				this.model = rowView.model;
				this.parentModel = parentModel;

				this.init();
			}

			/**
			 * Gets a field view.
			 *
			 * @protected
			 */
			getFieldView(name: string): FieldView | false {
				return this.rowView.getView(name + 'Field') || false;
			}

			/**
			 * Set field readonly.
			 *
			 * @protected
			 */
			setFieldReadonly(name: string, locked?: boolean): void {
				const view = this.getFieldView(name);

				if (view) {
					view.setReadOnly(locked);
				}
			}

			/**
			 * Set field not readonly.
			 *
			 * @protected
			 */
			setFieldNotReadonly(name: string): Promise<void> | void {
				const view = this.getFieldView(name);

				if (!view) {
					return;
				}

				view.setNotReadOnly();

				// TODO: WTF yuri?
				if (view.isDetailMode()) {
					return view.setEditMode().then(() => view.reRender());
				}
			}

			/**
			 * Set field hidden.
			 *
			 * @protected
			 */
			setFieldHidden(name: string): void {
				const view = this.getFieldView(name);

				if (view) {
					if (view.isRendered()) {
						view.hide();
					} else {
						view.once('after:render', view.hide);
					}
				}
			}

			/**
			 * Set field visible.
			 *
			 * @protected
			 */
			setFieldVisible(name: string): void {
				const view = this.getFieldView(name);

				if (view) {
					if (view.isRendered()) {
						view.show();
					} else {
						view.once('after:render', view.show);
					}
				}
			}

			/**
			 * On record list row render. Do not override.
			 */
			_rowRender(): void {
				const attributes = this.model.getClonedAttributes() as Record<string, unknown>;

				this.onChange(this.model, {afterInit: true});

				Object.entries(attributes).forEach(([attribute, value]) => {
					const methodName = 'onChange' + Espo.Utils.upperCaseFirst(attribute);

					if (methodName in this) {
						(this as Record<string, (model: Model, value: unknown, options: ChangeOptions) => void>)[methodName](this.model, value, {afterInit: true});
					}
				});
			}

			/**
			 * Initialization logic - called only once. To be extended.
			 *
			 * @public
			 */
			init(): void {}

			/**
			 * Called on model change. To be extended.
			 *
			 * @public
			 */
			onChange(_model: Model, _options: ChangeOptions): void {}
		}

		return RecordListDynamicHandler;
	},
);
