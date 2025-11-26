import type EmailAddressVarcharFieldView from 'espocrm/src/views/email/fields/email-address-varchar';

type AutocompleteModule = {
	optionsOverrides?: {
		minChars?: number;
	};
};

type EmailAddressVarcharData = {
	targetListIcon?: string;
	targetListColor?: string;
	[key: string]: unknown;
};

type ContactResponse = {
	list: Array<{
		emailAddress: string;
		name: string;
	}>;
};

extend<EmailAddressVarcharFieldView>(['ui/autocomplete'], (Dep, Autocomplete: AutocompleteModule) => class extends Dep {
	override editTemplate = 'viacrm:email/fields/email-address-varchar/edit';

	override data(): EmailAddressVarcharData {
		const targetListClientDefs = this.getMetadata().get(['clientDefs', 'TargetList'], {}) as {
			iconClass?: string;
			color?: string;
		};

		return {
			...super.data(),
			targetListIcon: targetListClientDefs.iconClass,
			targetListColor: targetListClientDefs.color,
		};
	}

	override setup(): void {
		super.setup();

		this.addActionHandler('selectTargetList', () => {
			this.createView(
				'modal',
				'views/modals/select-records',
				{
					scope: 'TargetList',
					multiple: true,
				},
				(view: { render: () => void }) => {
					view.render();

					this.listenToOnce(view, 'select', (targetLists: Array<{ id: string }>) => {
						const ids = targetLists.map(targetList => targetList.id);

						const url =
							'Contact?' +
							$.param({
								select: 'emailAddress,name',
								where: [
									{
										type: 'linkedWith',
										field: 'targetLists',
										value: ids,
									},
								],
								offset: 0,
							});

						Espo.Ajax.getRequest(url).then((response: ContactResponse) =>
							response.list.forEach((contact, index) => {
								setTimeout(() => this.addAddress(contact.emailAddress, contact.name), 150 * index);
							})
						);
					});
				},
			);
		});
	}

	override afterRender(): void {
		const minChars = this.params.autocompleteMinChars as number | undefined | null;

		if (minChars !== undefined && minChars !== null) {
			Autocomplete.optionsOverrides ??= {};
			const prev = Autocomplete.optionsOverrides.minChars;
			Autocomplete.optionsOverrides.minChars = minChars;

			try {
				super.afterRender();
			} finally {
				Autocomplete.optionsOverrides.minChars = prev;
			}

			return;
		}

		super.afterRender();
	}
});
