import type FloatWithUnitView from 'viacrm:views/fields/float-with-unit';

define(
	['viacrm:views/fields/float-with-unit'],
	(Dep: typeof FloatWithUnitView) => class extends Dep {
		editTemplate = 'viacrm:fields/float-with-units-float-only/edit';
	},
);
