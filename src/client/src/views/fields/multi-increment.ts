define(['views/fields/varchar'], Dep => class extends Dep {
	override type = 'multiIncrement';

	override validations = [];

	override inlineEditDisabled = true;
	override readOnly = true;

	override fetch(): Record<string, number | null> {
		return {};
	}
});
