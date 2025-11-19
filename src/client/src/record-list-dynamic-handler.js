define(() => {
	/**
	 * @memberOf module:autocrm:record-list-dynamic-handler
	 */
	class Class {
		constructor(rowView, parentView, parentModel) {
			/**
			 * A row view.
			 *
			 * @protected
			 * @type {module:view.Class}
			 */
			this.rowView = rowView;

			/**
			 * A parent view.
			 *
			 * @protected
			 * @type {module:view.Class}
			 */
			this.parentView = parentView;

			/**
			 * A model.
			 *
			 * @protected
			 * @type {module:model.Class}
			 */
			this.model = rowView.model;

			/**
			 * A parent model.
			 *
			 * @protected
			 * @type {module:model.Class}
			 */
			this.parentModel = parentModel;

			this.init();
		}

		/**
		 * Gets a field view.
		 *
		 * @protected
		 * @param {string} name A field name.
		 * @returns {module:views/fields/base.Class|boolean}
		 */
		getFieldView(name) {
			return this.rowView.getView(name + 'Field') || false;
		}

		/**
		 * Set field readonly.
		 *
		 * @protected
		 * @param {string} name A field name.
		 * @param {boolean} locked Won't be able to set back.
		 */
		setFieldReadonly(name, locked) {
			const view = this.getFieldView(name);

			if (view) {
				view.setReadOnly(locked);
			}
		}

		/**
		 * Set field not readonly.
		 *
		 * @protected
		 * @param {string} name A field name.
		 */
		setFieldNotReadonly(name) {
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
		 * @param {string} name A field name.
		 */
		setFieldHidden(name) {
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
		 * @param {string} name A field name.
		 */

		setFieldVisible(name) {
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
		_rowRender() {
			const attributes = this.model.getClonedAttributes();

			this.onChange(this.model, { afterInit: true });

			Object.entries(attributes).forEach(([attribute, value]) => {
				const methodName = 'onChange' + Espo.Utils.upperCaseFirst(attribute);

				if (methodName in this) {
					this[methodName](this.model, value, { afterInit: true });
				}
			});
		}

		/**
		 * Initialization logic - called only once. To be extended.
		 *
		 * @public
		 */
		init() {}

		/**
		 * Called on model change. To be extended.
		 *
		 * @public
		 * @param {module:model.Class} model A model.
		 * @param {Object} o Options.
		 */
		// eslint-disable-next-line no-unused-vars
		onChange(model, o) {}
	}

	return Class;
});
