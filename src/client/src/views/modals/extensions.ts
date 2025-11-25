define(['views/modal'], Dep => class extends Dep {
	override template = 'viacrm:modals/extensions';

	packageContents: string | null = null;

	//@ts-ignore this will always be set for us
	collection: Collection;

	override setup() {
		this.headerText = this.translate('Extensions', 'labels', 'Admin');

		this.buttonList = [
			{
				name: 'close',
				label: 'Close',
			},
		];

		Espo.Ui.notifyWait();

		this.wait(
			this.getCollectionFactory()
				.create('Extension')
				.then(collection => {
					this.collection = collection;
					return this.collection.fetch();
				})
				.then(() => {
					this.createView('list', 'views/extension/record/list', {
						collection: this.collection,
						el: this.getSelector() + ' .list-container',
					});

					Espo.Ui.notify(false);
				}),
		);

		this.events['change input[name="package"]'] = (e: JQuery.ClickEvent) => {
			this.$el.find('button[data-action="upload"]').addClass('disabled').attr('disabled', 'disabled');

			this.$el.find('.message-container').html('');

			const files = e.currentTarget.files;

			if (files.length) {
				this.selectFile(files[0]);
			}
		};

		this.events['click button[data-action="upload"]'] = () => {
			this.upload();
		};
	}

	selectFile(file) {
		const fileReader = new FileReader();

		fileReader.onload = e => {
			const target = e.target;

			if (!target) {
				return;
			}

			const result = target.result;

			if (typeof result !== 'string') {
				return;
			}

			this.packageContents = result;

			this.$el.find('button[data-action="upload"]').removeClass('disabled').removeAttr('disabled');

			const maxSize: number = this.getHelper().getAppParam('maxUploadSize') ?? 0;

			if (file.size > maxSize * 1024 * 1024) {
				const body = this.translate('fileExceedsMaxUploadSize', 'messages', 'Extension').replace(
					'{maxSize}',
					maxSize + 'MB',
				);

				Espo.Ui.dialog({
					body: this.getHelper().transformMarkdownText(body).toString(),
					buttonList: [
						{
							name: 'close',
							text: this.translate('Close'),
							onClick: dialog => dialog.close(),
						},
					],
				}).show();
			}
		};

		fileReader.readAsDataURL(file);
	}

	upload() {
		this.$el.find('button[data-action="upload"]').addClass('disabled').attr('disabled', 'disabled');

		Espo.Ui.notify(this.translate('Uploading...'));

		Espo.Ajax.postRequest('Extension/action/upload', this.packageContents, {
			timeout: 0,
			contentType: 'application/zip',
		})
			.then(data => {
				if (!data.id) {
					this.showError(this.translate('Error occurred'));

					return;
				}

				Espo.Ui.notify(false);

				this.createView(
					'popup',
					'views/admin/extensions/ready',
					{
						upgradeData: data,
					},
					view => {
						view.render();

						this.$el
							.find('button[data-action="upload"]')
							.removeClass('disabled')
							.removeAttr('disabled');

						view.once('run', () => {
							view.close();

							this.$el.find('.panel.upload').addClass('hidden');

							this.run(data.id, data.version, data.name);
						});
					},
				);
			})
			.catch(xhr => {
				this.showError(xhr.getResponseHeader('X-Status-Reason'));

				Espo.Ui.notify(false);
			});
	}

	run(id, version, name) {
		Espo.Ui.notify(this.translate('pleaseWait', 'messages'));

		this.showError(false);
		this.showErrorNotification(false);

		Espo.Ajax.postRequest('Extension/action/install', { id }, { timeout: 0, bypassAppReload: true })
			.then(() => {
				const cache = this.getCache();

				if (cache) {
					cache.clear();
				}

				this.createView(
					'popup',
					'views/admin/extensions/done',
					{
						version: version,
						name: name,
					},
					view => {
						if (this.collection.length) {
							this.collection.fetch({ bypassAppReload: true });
						}

						this.$el.find('.list-container').removeClass('hidden');
						this.$el.find('.panel.upload').removeClass('hidden');

						Espo.Ui.notify(false);

						view.render();
					},
				);
			})
			.catch(xhr => {
				this.$el.find('.panel.upload').removeClass('hidden');

				const msg = xhr.getResponseHeader('X-Status-Reason');

				this.showErrorNotification(this.translate('Error') + ': ' + msg);
			});
	}

	showError(msg: string | false) {
		if (!msg) {
			this.$el.find('.message-container').html('');

			return;
		} else {
			msg = this.translate(msg, 'errors', 'Admin');

			this.$el.find('.message-container').html(msg);
		}
	}

	showErrorNotification(msg: string | false) {
		if (!msg) {
			this.$el.find('.notify-text').addClass('hidden');

			return;
		} else {
			msg = this.translate(msg, 'errors', 'Admin');

			this.$el.find('.notify-text').html(msg);
			this.$el.find('.notify-text').removeClass('hidden');
		}
	}
});
