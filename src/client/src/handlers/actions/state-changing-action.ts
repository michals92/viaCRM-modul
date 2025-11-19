define(['action-handler'], Dep => class extends Dep {
	/**
         * @abstract
         */
	state = null;

	/**
         * @abstract
         */
	name: string = '';

	showStates: string[] = [];
	hideStates: string[] = [];
	emptyStatusActionIsVisible: boolean = true;

	init() {
		this.checkVisibility();

		this.view.listenTo(this.view.model, 'change:status', () => this.checkVisibility());
	}

	checkVisibility() {
		const status = this.view.model.get<string>('status');

		if (!status) {
			this.changeActionVisibility(this.emptyStatusActionIsVisible);

			return;
		}

		const show = this.showStates.length === 0 || this.showStates.includes(status);

		const hide = this.hideStates.includes(status);

		this.changeActionVisibility(show && !hide);
	}

	changeActionVisibility(visible: boolean) {
		if (visible) {
			this.view.showHeaderActionItem(this.name);
		} else {
			this.view.hideHeaderActionItem(this.name);
		}
	}

	actionProcess() {
		if (this.state === null) return;

		this.view.confirm(this.view.translate('confirmation', 'messages'), () => {
			Espo.Ui.notify('Please wait...');

			const result = this.view.model
				.save({
					status: this.state,
				})
				.then(() => {
					Espo.Ui.notify('Done', 'success');
				});

			/*
                 * Might be jQuery ajax result (Espo <= 7.5) or Promise
                 * @TODO: remove in the future
                 */
			const finallyMethod = 'finally' in result ? 'finally' : 'always';

			result[finallyMethod](() => {
				this.view.model.fetch();
			});
		});
	}
});
