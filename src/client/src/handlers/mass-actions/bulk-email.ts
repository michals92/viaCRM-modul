import type ListRecordView from 'espocrm/src/views/record/list';
import type EspoEmailHelper from 'espocrm/src/email-helper';

define([], () => class {
	view: ListRecordView;

	constructor(view: ListRecordView) {
		this.view = view;
	}
		
	checkVisibility() {
		const collectionName = this.view.collection.name;
		let hide = !collectionName; // ignore lists with unset collections

		if (!hide || collectionName === 'GlobalSearch') {
			const fields = this.view
				.getMetadata()
				.get(['entityDefs', this.view.collection.name as string, 'fields']);

			if (fields) {
				hide = !Object.keys(fields).some(name => name === 'emailAddress');
			}
		}

		if (hide) {
			this.view.removeMassAction('bulkEmail');
			this.view.removeMassAction('bulkEmailBcc');
		}
	}

	// TODO: doesn't actually work, redo (needs server side email list fetching, this code is terrible)
	async bulkEmail(data, isBcc: boolean) {
		let mailList: string[] = [];

		// "select all" checked
		if (data.params.byWhere) {
			const collection = await this.view.getCollectionFactory().create(data.entityType);

			collection.where = data.params.where;
			collection.data = data.params.selectData;

			await collection.fetch();

			mailList = collection.models.map(model => model.get('emailAddress') as string).filter(Boolean);
		} else {
			for (const id of data.params.ids) {
				const model = this.view.collection.get(id);
				const emailAddress = model?.get('emailAddress') as string;

				if (emailAddress) {
					mailList.push(emailAddress);
				}
			}
		}

		if (mailList.length === 0) {
			Espo.Ui.notify(this.view.translate('noEmailsInSelect', 'messages'), 'warning');
			return;
		}

		const attributes: {
				status: string;
				to?: string;
				bcc?: string;
			} = { status: 'Draft' };
		const mailListStr = mailList.join(';');

		if (isBcc === true) {
			attributes.bcc = mailListStr;
		} else {
			attributes.to = mailListStr;
		}

		if (
			this.view.getConfig().get<boolean>('emailForceUseExternalClient') ||
				this.view.getPreferences().get<boolean>('emailUseExternalClient') ||
				!this.view.getAcl().checkScope('Email', 'create')
		) {
			const EmailHelper = await Espo.loader.requirePromise('email-helper');
			const emailHelper: EspoEmailHelper = new EmailHelper();

			//@ts-ignore TODO: fix this for 8.2.0+
			document.location.href = emailHelper.composeMailToLink(
				attributes,
				this.view.getConfig().get('outboundEmailBccAddress'),
			);

			return;
		}

		const viewName =
				this.view
					.getMetadata()
					.get<string>(['clientDefs.', this.view.scope as string, 'modalViews', 'compose']) ||
				this.view.getMetadata().get<string>(['clientDefs.', 'Global', 'modalViews', 'compose']) ||
				'views/modals/compose-email';

		Espo.Ui.notifyWait();

		this.view.createView('quickCreate', viewName as string, { attributes }, view => {
			view.render();
			Espo.Ui.notify(false);
		});
	}

	actionBulkEmailBcc(data) {
		void this.bulkEmail(data, true);
	}

	actionBulkEmail(data) {
		void this.bulkEmail(data, false);
	}
});
