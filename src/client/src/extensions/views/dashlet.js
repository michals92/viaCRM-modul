extend(Dep => class extends Dep {
	setup() {
		this.name = this.options.name;
		this.id = this.options.id;

		this.on('resize', () => {
			let bodyView = this.getView('body');

			if (!bodyView) {
				return;
			}

			bodyView.trigger('resize');
		});

		let viewName =
				this.getMetadata().get(['dashlets', this.name, 'view']) ||
				'views/dashlets/' + Espo.Utils.camelCaseToHyphen(this.name);

		this.createView('body', viewName, {
			selector: '.dashlet-body',
			id: this.id,
			name: this.name,
			readOnly: this.options.readOnly,
			locked: this.options.locked,
			collapsed: this.options.collapsed,
		});

		if (this.getPreferences().get('collapsibleDashlets')) {
			this.events['click .panel-heading,.panel-title'] = e => {
				if ($(e.target).hasClass('panel-heading') || $(e.target).hasClass('panel-title')) {
					e.stopPropagation(); //Prevent double toggle
					this.getView('body').actionToggle();
				}
			};
		}
	}
});
