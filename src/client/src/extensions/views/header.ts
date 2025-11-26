import type HeaderView from 'espocrm/src/views/header';

extend<HeaderView>(Dep => class extends Dep {
	override afterRender(): void {
		super.afterRender();

		const $header = this.$el;

		const mq = window.matchMedia('(min-width: 1200px)');
		const stickyHeaderEnabled = this.getConfig().get('stickyHeader') as boolean;

		if (mq.matches && stickyHeaderEnabled) {
			const headerHeight = $header.outerHeight();

			$(window).on('scroll.headerSticky', () => {
				const scrollTop = $(window).scrollTop();
				const top = $('.nav.navbar-nav.navbar-right').height();

				if (scrollTop !== undefined && scrollTop > 20) {
					if ($header.css('position') !== 'fixed') {
						$('body').css('padding-top', headerHeight + 'px');
					}

					$header.css({
						position: 'fixed',
						'padding-top': '20px',
						'padding-bottom': '10px',
						top,
						width: $('#main').width(),
					});
				} else {
					$('body').css('padding-top', '');

					$header.css({
						position: 'relative',
						top: '',
						'margin-top': '',
						width: '',
					});
				}
			});

			$(window).trigger('scroll.headerSticky');
		}
	}

	override onRemove(): void {
		if (super.onRemove) {
			super.onRemove();
		}

		const mq = window.matchMedia('(min-width: 1200px)');
		const stickyHeaderEnabled = this.getConfig().get('stickyHeader') as boolean;

		if (mq.matches && stickyHeaderEnabled) {
			$(window).off('scroll.headerSticky');
			$('body').css('padding-top', '');
		}
	}
});
