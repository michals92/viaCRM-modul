define(['view'], Dep => class extends Dep {
	override template = 'autocrm:team-switcher/panel';
	private teams: any = {};
	private defaultTeam: any = {};

	override events = {
		'click .dropdown-item[data-id]': function (e) {
			const teamId = $(e.currentTarget).data('id');
				
			if (teamId) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				this.trigger('set-default-team', teamId);
			}
		},
	};

	override setup() {
		this.teams = this.options.teams || {};
		this.defaultTeam = this.options.defaultTeam || {};
	}

	override data() {
		return {
			teams: Object.keys(this.teams).length > 0 ? this.teams : null,
			defaultTeam: this.defaultTeam.id ? this.defaultTeam : null,
		};
	}
});
