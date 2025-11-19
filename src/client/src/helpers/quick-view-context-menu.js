define(() => 
	/**
	 * @memberOf module:autocrm:helpers/quick-view-context-menu
	 */
	class {
		register(view, selector) {
			if (view.disableQuickViewContextMenu === true) {
				return;
			}

			const enabled = view.getPreferences().get('quickViewContextMenu');

			if (!enabled) {
				return;
			}

			view.events[`mouseover ${selector}`] = e => {
				const { currentTarget: el } = e;
				el.classList.add('quick-view-context-menu');
			};

			view.events[`mouseout ${selector}`] = e => {
				const { currentTarget: el } = e;
				el.classList.remove('quick-view-context-menu');
			};

			view.events[`contextmenu ${selector}`] = e => {
				const { currentTarget: el } = e;

				const id = el.getAttribute('data-id');

				if (id) {
					e.preventDefault();
					e.stopPropagation();
					view.actionQuickView({ id });
				}
			};

			/*view.events[`auxclick ${selector}`] = e => {
				const { currentTarget: el } = e;

				const id = el.getAttribute('data-id');

				const scope = view.scope;

				// Middle click
				if (id && scope && e.which === 2) {
					const url = '#' + scope + '/view/' + id;

					window.open(url, '_blank');
				}
			};*/
		}
	}
);
