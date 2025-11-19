define(['views/fields/varchar'], Dep => class extends Dep {
	styleList: string[] = [
		'default',
		'success',
		'danger',
		'warning',
		'info',
		'primary',
	];

	override setup() {
		super.setup();
		this.setupOptions();
		this.listenTo(this.model, 'change:' + this.name, this.applyStyle.bind(this));
	}

	override afterRender() {
		super.afterRender();
		this.applyStyle();
	}

	applyStyle() {
		this.$element?.removeClass((_, className: string) => (className.match(/(^|\s)btn-\S+/g) || []).join(' '));
		const style: string | null = this.model.get(this.name);
		if (style) {
			this.$element?.addClass(`btn-${style}`);
		}
	}

	override data() {
		const data = super.data();
		if (data.isNotEmpty) {
			data.textClass = 'label label-md label-state text-' + this.model.get(this.name);
		}
		return data;
	}

	override setupOptions() {
		this.params["options"] = this.styleList;
	}
});
