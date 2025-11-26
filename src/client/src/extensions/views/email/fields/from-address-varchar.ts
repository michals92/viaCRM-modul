import type EmailFromAddressVarchar from 'espocrm/src/views/email/fields/from-address-varchar';

type EmailHelper = {
	parseNameFromStringAddress(fromString: string): string | null;
};

type EmailHelperConstructor = new (
	language: unknown,
	user: unknown,
	dateTime: unknown,
	acl: unknown
) => EmailHelper;

type PersonAttributes = {
	emailAddress: string;
	accountId?: string;
	accountName?: string;
	firstName?: string;
	lastName?: string;
	source?: string;
	emailAddressData?: Array<{
		emailAddress: string;
		lower: string;
		primary: boolean;
		optOut: boolean;
		invalid: boolean;
		accountId: string | null;
		accountName: string | null;
	}>;
};

extend<EmailFromAddressVarchar>(['email-helper'], (Dep, EmailHelper: EmailHelperConstructor) => class extends Dep {
	override createPerson(scope: string, address: string): void {
		const fromString = (this.model.get('fromString') || this.model.get('fromName')) as string | null;
		let name = this.nameHash[address] as string | null || null;

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

		const attributes: PersonAttributes = {
			emailAddress: address,
		};

		if (this.model.get('accountId') && scope === 'Contact') {
			attributes.accountId = this.model.get('accountId') as string;
			attributes.accountName = this.model.get('accountName') as string;
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

		if (scope === 'Lead') {
			attributes.source = 'Email';
		}

		const viewName = (this.getMetadata().get(`clientDefs.${scope}.modalViews.edit`) as string) || 'views/modals/edit';

		this.createView(
			'create',
			viewName,
			{
				scope: scope,
				attributes: attributes,
			},
			(view: { render: () => void }) => {
				view.render();

				this.listenTo(view, 'after:save', (model: { id: string; get: (key: string) => unknown }) => {
					const nameHash = Espo.Utils.clone(this.model.get('nameHash') || {}) as Record<string, string>;
					const typeHash = Espo.Utils.clone(this.model.get('typeHash') || {}) as Record<string, string>;
					const idHash = Espo.Utils.clone(this.model.get('idHash') || {}) as Record<string, string>;

					idHash[address] = model.id;
					nameHash[address] = model.get('name') as string;
					typeHash[address] = scope;

					this.idHash = idHash;
					this.nameHash = nameHash;
					this.typeHash = typeHash;

					const attrs = {
						nameHash: nameHash,
						idHash: idHash,
						typeHash: typeHash,
					};

					setTimeout(() => {
						this.model.set(attrs);

						if (this.model.get('icsContents')) {
							this.model.fetch();
						}
					}, 50);
				});
			},
		);
	}
});
