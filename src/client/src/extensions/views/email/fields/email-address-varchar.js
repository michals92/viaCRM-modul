extend(['ui/autocomplete'], (Dep, Autocomplete) => class extends Dep {
	editTemplate = 'autocrm:email/fields/email-address-varchar/edit';

	data() {
		const targetListClientDefs = this.getMetadata().get(['clientDefs', 'TargetList'], {});

		return {
			...super.data(),
			targetListIcon: targetListClientDefs.iconClass,
			targetListColor: targetListClientDefs.color,
		};
	}

	setup() {
		super.setup();

		this.addActionHandler('selectTargetList', () => {
			this.createView(
				'modal',
				'views/modals/select-records',
				{
					scope: 'TargetList',
					multiple: true,
				},
				view => {
					view.render();

					this.listenToOnce(view, 'select', targetLists => {
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

						Espo.Ajax.getRequest(url).then(response =>
							response.list.forEach((contact, index) => {
								setTimeout(() => this.addAddress(contact.emailAddress, contact.name), 150 * index);
							})
						);
					});
				},
			);
		});
	}

	afterRender() {
		const minChars = this.params.autocompleteMinChars;

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
