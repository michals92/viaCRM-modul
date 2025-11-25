import type View from 'espocrm/src/view';

define(['views/record/panels/bottom'], Dep => class extends Dep {
	override templateContent = '<div class="scheduler-container no-margin">{{{scheduler}}}</div>';

	override setup() {
		super.setup();

		this.createView('scheduler', 'viacrm:views/task/scheduler/scheduler', {
			selector: '.scheduler-container',
			notToRender: true,
			model: this.model,
		});

		this.once('after:render', () => {
			if (this.disabled) {
				return;
			}

			this.getSchedulerView().render();
			this.getSchedulerView().notToRender = false;
		});

		if (this.defs.disabled) {
			this.once('show', () => {
				this.getSchedulerView().render();
				this.getSchedulerView().notToRender = false;
			});
		}
	}

	actionRefresh() {
		this.getSchedulerView().reRender();
	}

	getSchedulerView(): View {
		return this.getView('scheduler') as unknown as View;
	}
});
