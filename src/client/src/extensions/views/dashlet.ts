import type DashletView from 'espocrm/src/views/dashlet';

type DashletOptions = {
	name: string;
	id: string;
	readOnly?: boolean;
	locked?: boolean;
	collapsed?: boolean;
};

type BodyView = {
	trigger(event: string): void;
	actionToggle(): void;
};

extend<DashletView>(Dep => class extends Dep {
	declare name: string;
	declare id: string;
	declare options: DashletOptions;

	override setup(): void {
		this.name = this.options.name;
		this.id = this.options.id;

		this.on('resize', () => {
			let bodyView = this.getView('body') as BodyView | null;

			if (!bodyView) {
				return;
			}

			bodyView.trigger('resize');
		});

		let viewName =
				(this.getMetadata().get(['dashlets', this.name, 'view']) as string) ||
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
			this.events['click .panel-heading,.panel-title'] = (e: Event) => {
				if ($(e.target as HTMLElement).hasClass('panel-heading') || $(e.target as HTMLElement).hasClass('panel-title')) {
					e.stopPropagation(); //Prevent double toggle
					(this.getView('body') as BodyView).actionToggle();
				}
			};
		}
	}
});
