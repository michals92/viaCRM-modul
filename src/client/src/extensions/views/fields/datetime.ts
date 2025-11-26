import type DatetimeFieldView from 'espocrm/src/views/fields/datetime';

extend<DatetimeFieldView>(Dep => class extends Dep {
	override editTemplate = 'viacrm:fields/datetime/edit';
});
