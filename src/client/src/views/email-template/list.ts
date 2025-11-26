import type ModalView from 'espocrm/src/views/modal';

define(['views/email-template/list'], Dep => class extends Dep {
	override actionCreate() {
		this.createView('createModal', 'viacrm:views/email-template/modals/create', {}, (view: ModalView) => {
			view.render();

			this.listenToOnce(view, 'create', (data: any) => {
				view.close();

				const url = '#EmailTemplate/create/type=' + data.type;
				const attributes = this.getCreateAttributes() || {};
				const options: any = { attributes };

				if (this.keepCurrentRootUrl) {
					options.rootUrl = this.getRouter().getCurrentUrl();
				}

				const returnDispatchParams = {
					controller: this.scope,
					action: null,
					options: { isReturn: true },
				};

				this.prepareCreateReturnDispatchParams(returnDispatchParams);

				Object.assign(options, {
					type: data.type,
					returnUrl: this.getRouter().getCurrentUrl(),
					returnDispatchParams,
				});

				this.getRouter().navigate(url, { trigger: false });
				this.getRouter().dispatch('EmailTemplate', 'create', options);
			});
		});
	}
});
