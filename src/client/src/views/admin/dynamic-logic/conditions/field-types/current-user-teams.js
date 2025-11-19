define(['autocrm:views/admin/dynamic-logic/conditions/field-types/link-multiple'], (Dep) => class extends Dep {
	translateLeftString() {
		return '$' + this.translate('User', 'scopeNames') + '.' + super.translateLeftString();
	}

	fetch() {
		const data = super.fetch();

		data.attribute = '$user.teamsIds';
		return data;
	}
});
