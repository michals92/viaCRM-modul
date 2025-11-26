define(['views/base'], Dep => class extends Dep {
	/*constructor(options = {}) {
			super(options);

			this.getRowElement = this.options.getRowElement;
			this.getFieldElement = this.options.getFieldElement;
		}

		_setElement() {
			this.$el = this.getRowElement();
			this.element = this.$el[0];
		}

		setView(key, view, fullSelector) {
			const wrapper = () => this.getFieldElement(this._nestedViewDefs[key].options.columnName);
			view._setElement = function (_) {
				this.$el = wrapper();
				this.element = this.$el[0];
			};

			super.setView(key, view, fullSelector);
		}*/
});
