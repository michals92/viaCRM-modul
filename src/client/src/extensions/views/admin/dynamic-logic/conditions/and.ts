import type _default from 'espocrm/src/views/admin/dynamic-logic/conditions/and';

type EventsMap = Record<string, (e?: Event) => void>;

extend<_default>(Dep => class extends Dep {
	template: string = 'viacrm:admin/dynamic-logic/conditions/group-base';

	events: EventsMap = {
		'click > div.group-head > [data-action="remove"]': function (e?: Event) {
			e?.stopPropagation();

			this.trigger('remove-item');
		},
		'click > div.group-bottom [data-action="addField"]': function () {
			this.actionAddField();
		},
		'click > div.group-bottom [data-action="addAnd"]': function () {
			this.actionAddGroup('and');
		},
		'click > div.group-bottom [data-action="addOr"]': function () {
			this.actionAddGroup('or');
		},
		'click > div.group-bottom [data-action="addNot"]': function () {
			this.actionAddGroup('not');
		},
		'click > div.group-bottom [data-action="addCurrentUser"]': function () {
			this.addCurrentUser();
		},
		'click > div.group-bottom [data-action="addCurrentUserTeams"]': function () {
			this.addCurrentUserTeams();
		},
		'click > div.group-bottom [data-action="addCurrentUserRoles"]': function () {
			this.addCurrentUserRoles();
		},
	};
});
