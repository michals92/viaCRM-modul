define(['views/dashlets/abstract/base'], (Dep) => class extends Dep {
	name = 'SharedWysiwyg';

	override templateContent = `
            <div class="shared-wysiwyg-container">
                {{{record}}}
            </div>
        `;

	override setup() {
		super.setup();

		const sharedWysiwygId = this.getOption('sharedWysiwygId');

		if (!sharedWysiwygId) {
			this.templateContent = `<div class="no-data">{{translate 'No Data'}}</div>`;
			return;
		}

		this.wait(
			this.getModelFactory()
				.create('SharedWysiwyg')
				.then(model => {
					model.id = sharedWysiwygId;
					this.model = model;

					const fetchPromise = model.fetch();

					this.createView('record', 'views/record/detail', {
						selector: '.shared-wysiwyg-container',
						scope: 'SharedWysiwyg',
						model: model,
						buttonsDisabled: true,
						bottomView: null,
						sideView: null,
						sideDisabled: true,
						inlineEditDisabled: true,
						detailLayout: [
							{
								rows: [
									[
										{
											name: 'content',
											fullWidth: true,
											noLabel: true
										}
									]
								]
							}
						]
					});

					return fetchPromise;
				})
		);
	}

	override setupActionList() {
		this.actionList.unshift({
			name: 'edit',
			text: this.translate('Edit'),
			iconHtml: '<span class="fas fa-edit"></span>',
		});
	}

	actionEdit() {
		if (this.model) {
			Espo.Ui.notifyWait();

			const options = {
				scope: 'SharedWysiwyg',
				model: this.model,
				id: this.model.id,
				quickEditDisabled: false,
			};

			this.createView('modal', 'views/modals/edit', options, modalView => {
				modalView.render()
					.then(() => Espo.Ui.notify(false));

				this.listenToOnce(modalView, 'remove', () => {
					this.clearView('modal');
				});
			});
		}
	}

	override actionRefresh(): void {
		if (this.model) {
			this.model.fetch().then(() => {
				const recordView = this.getView('record');

				if (recordView) {
					recordView.reRender();
				}
			});
		}
	}
});