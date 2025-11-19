import type User from 'espocrm/src/models/user';
import type View from 'espocrm/src/view';

define(['autocrm:views/site/navbar/user-only'], (Dep: typeof View) => class extends Dep {
	override template = 'autocrm:site/navbar/team-switching';

	private teams: any = {};
	private defaultTeam: any = {};

	override init() {
		if (!this.getPreferences().get('enableTeamSwitchingInNavbar')) {
			this.remove();
			return;
		}
		this.loadTeams();
	}

	override async setup() {
		this.addActionHandler('showTeamSwitcher', () => this.showTeamSwitcher());
		this.listenTo(this.getUser(), 'change:defaultTeamId change:teamsIds', () => {
			this.loadTeams();
			this.closeTeamSwitcher();
			this.reRender();
		});
	}

	private closeTeamSwitcher() {
		const $container = this.$el.find('.user-teams-container');
		$container.empty();

		if (this.hasView('panel')) {
			const panelView = this.getView('panel');
			if (panelView) {
				this.stopListening(panelView);
				panelView.remove();
			}
		}

		$(document).off('mouseup.teamswitcher');
		this.stopListening(this.getRouter(), 'route');
	}

	private showTeamSwitcher() {
		const $container = this.$el.find('.user-teams-container');
		if ($container.find('#team-switcher-panel').length > 0) {
			this.closeTeamSwitcher();
			return;
		}

		if (Object.keys(this.teams).length === 0) {
			return;
		}

		const $panel = $('<div>').attr('id', 'team-switcher-panel');
		$panel.appendTo($container);
		this.createView(
			'panel',
			'autocrm:views/team-switcher/panel',
			{
				fullSelector: '#team-switcher-panel',
				teams: this.teams,
				defaultTeam: this.defaultTeam,
			},
			view => {
				view.render();
				this.listenTo(view, 'set-default-team', teamId => {
					this.setDefaultTeam(this.getUser(), teamId).then(() => this.closeTeamSwitcher());
				});
			},
		);

		const $document = $(document);
		$document.on('mouseup.teamswitcher', (e: JQuery.MouseUpEvent) => {
			const $target = $(e.target);
			if (
				!$panel.is(e.target) &&
					$panel.has(e.target).length === 0 &&
					!$target.closest('#nav-team-switching').length &&
					!$target.closest('div.modal-dialog').length &&
					!e.target.classList.contains('modal')
			) {
				this.closeTeamSwitcher();
			}
		});

		if (window.innerWidth < this.getThemeManager().getParam('screenWidthXs')) {
			this.listenToOnce(this.getRouter(), 'route', () => {
				this.closeTeamSwitcher();
			});
		}
	}

	private loadTeams() {
		const user = this.getUser();
		this.defaultTeam = { id: user.attributes.defaultTeamId, name: user.attributes.defaultTeamName };
		this.teams = { ...(user.attributes.teamsNames as Record<string, never>) };
		if (this.defaultTeam.id) {
			delete this.teams[this.defaultTeam.id];
		}

		if (Object.keys(this.teams).length === 0) {
			this.teams['none'] = this.translate('No Available Teams', 'teams', 'Global');
		}
	}

	override data() {
		return {
			defaultTeam: this.defaultTeam.id ? this.defaultTeam : null,
		};
	}

	private async setDefaultTeam(user: User, teamId: string | null): Promise<void> {
		const allTeams = { ...this.teams, [this.defaultTeam.id]: this.defaultTeam.name };
		const teamName = allTeams[teamId ?? 'none'] || teamId;
		if (teamId === 'none') {
			teamId = null;
		}

		try {
			await user.save({ defaultTeamId: teamId }, { patch: true });
			Espo.Ui.success(
				this.translate('Default Team Updated', 'teams', 'Global').replace('{teamName}', teamName),
			);

			setTimeout(() => window.location.reload(), 1500);
		} catch {
			Espo.Ui.error(this.translate('Error Updating Default Team', 'teams', 'Global'));
		}
	}

	override afterRender() {
		if (!this.getPreferences().get('enableTeamSwitchingInNavbar')) {
			this.remove();
		}
	}

	override onRemove() {
		this.closeTeamSwitcher();
		super.onRemove();
	}
});
