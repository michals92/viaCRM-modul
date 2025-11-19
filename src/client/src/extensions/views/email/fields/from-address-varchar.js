extend(['email-helper'], (Dep, EmailHelper) => class extends Dep {
	createPerson(scope, address) {
		const fromString = this.model.get('fromString') || this.model.get('fromName');
		let name = this.nameHash[address] || null;

		if (!name && this.name === 'from' && fromString) {
			const emailHelper = new EmailHelper(
				this.getLanguage(),
				this.getUser(),
				this.getDateTime(),
				this.getAcl(),
			);

			name = emailHelper.parseNameFromStringAddress(fromString);
		}

		if (name) {
			name = this.getHelper().escapeString(name);
		}

		const attributes = {
			emailAddress: address,
		};

		if (this.model.get('accountId') && scope === 'Contact') {
			attributes.accountId = this.model.get('accountId');
			attributes.accountName = this.model.get('accountName');
		}

		if (name) {
			const firstName = name.split(' ').slice(0, -1).join(' ');
			const lastName = name.split(' ').slice(-1).join(' ');

			attributes.firstName = firstName;
			attributes.lastName = lastName;
		}

		attributes.emailAddressData = [
			{
				emailAddress: address,
				lower: address.toLowerCase(),
				primary: true,
				optOut: false,
				invalid: false,
				accountId: attributes.accountId || null,
				accountName: attributes.accountName || null,
			},
		];

		if (scope == 'Lead') {
			attributes.source = 'Email';
		}

		const viewName = this.getMetadata().get(`clientDefs.${scope}.modalViews.edit`) || 'views/modals/edit';

		this.createView(
			'create',
			viewName,
			{
				scope: scope,
				attributes: attributes,
			},
			view => {
				view.render();

				this.listenTo(view, 'after:save', model => {
					const nameHash = Espo.Utils.clone(this.model.get('nameHash') || {});
					const typeHash = Espo.Utils.clone(this.model.get('typeHash') || {});
					const idHash = Espo.Utils.clone(this.model.get('idHash') || {});

					idHash[address] = model.id;
					nameHash[address] = model.get('name');
					typeHash[address] = scope;

					this.idHash = idHash;
					this.nameHash = nameHash;
					this.typeHash = typeHash;

					const attributes = {
						nameHash: nameHash,
						idHash: idHash,
						typeHash: typeHash,
					};

					setTimeout(() => {
						this.model.set(attributes);

						if (this.model.get('icsContents')) {
							this.model.fetch();
						}
					}, 50);
				});
			},
		);
	}
});
