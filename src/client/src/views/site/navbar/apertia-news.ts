import type View from 'espocrm/src/view';

define(['viacrm:views/site/navbar/user-only'], (Dep: typeof View) => class extends Dep {
	override template = 'viacrm:site/navbar/apertia-news';
	iframeUrl!: string;
	iframeHeight!: number;
	iframeDisabled!: boolean;
	changeCount: null | string = null;
	currentTimestamp!: number;

	override setup() {
		if (this.isMobile()) {
			this.remove(false);
			return;
		}

		this.currentTimestamp = Math.floor(+new Date() / 1000);
		this.iframeUrl = this.getConfig().get('apertiaNewsNavbarIframeUrl') || 'https://apenews.trt.ls/';
		this.iframeHeight = this.getConfig().get('apertiaNewsNavbarIframeHeight') || 69;
		this.iframeDisabled = this.getConfig().get('apertiaNewsNavbarIframeDisabled') || false;

		this.fetchNewsCount();

		this.addActionHandler('showNews', () => this.showNews());
	}

	override data() {
		return {
			isRemoved: this.isRemoved(),
			changeCount: this.changeCount,
		};
	}

	showNews() {
		if (this.closeNews()) {
			return;
		}
		this.getStorage().set('state', 'lastSeenApeNewsDate', this.currentTimestamp);
		this.updateNewsCount(null);
		const $container = $('<div>').attr('id', 'ape-news-panel');

		$container.appendTo(this.$el.find('.ape-news-container'));
		this.createView(
			'panel',
			'viacrm:views/apertia-news/panel',
			{
				fullSelector: '#ape-news-panel',
				iframeUrl: this.iframeUrl,
				iframeHeight: this.iframeHeight,
				iframeDisabled: this.iframeDisabled,
				changeCount: this.changeCount,
			},
			view => {
				view.render();
				this.handleDocumentClick = (e: MouseEvent) => {
					const $panel = this.$el.find('#ape-news-panel');
					// Check if click is outside the panel and not on the element that opens the panel
					if (
						$panel.length &&
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							!$panel[0].contains(e.target as Node) &&
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							!$(e.target).closest('.ape-news-button').length
					) {
						this.closeNews();
					}
				};

				setTimeout(() => {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					$(document).on('click.news-panel', this.handleDocumentClick);
				}, 100);
			},
		);

		if (window.innerWidth < this.getThemeManager().getParam('screenWidthXs')) {
			this.listenToOnce(this.getRouter(), 'route', () => {
				this.closeNews();
			});
		}
	}

	private closeNews(): boolean {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		$(document).off('click.news-panel', this.handleDocumentClick);

		const $container = this.$el.find('.ape-news-container');
		$container.empty();

		this.stopListening(this.getRouter(), 'route');

		if (this.hasView('panel') && !this.getView('panel')?.isRemoved()) {
			this.getView('panel')?.remove();
			return true;
		}
		return false;
	}

	fetchNewsCount() {
		const now = new Date();
		const todayAt2AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 2, 0, 0, 0).getTime() / 1000;
		const lastSeenTimestamp = this.getStorage().get('state', 'lastSeenApeNewsDate') || 0;
		let resetReferenceTime: number;

		if (this.currentTimestamp < todayAt2AM) {
			resetReferenceTime = todayAt2AM - 24 * 60 * 60;
		} else {
			resetReferenceTime = todayAt2AM;
		}

		if (lastSeenTimestamp < resetReferenceTime) {
			fetch(this.iframeUrl + '?date=yesterday&countOnly=true')
				.then(response => {
					if (!response.ok) {
						throw new Error('Failed to fetch news count');
					}
					return response.text();
				})
				.then(data => {
					this.updateNewsCount(data);
				});
		} else {
			this.updateNewsCount(null);
		}
	}

	isAvailable() {
		// @ts-expect-error - super.isAvailable() method not defined in base View type
		return super.isAvailable() && this.getPreferences().get('enableApertiaNewsInNavbar') === true;
	}

	updateNewsCount(count: string | null) {
		this.changeCount = count;
		this.reRender();
	}

	isMobile() {
		// @ts-expect-error - navigator.userAgentData is experimental API not in TypeScript types
		if (navigator.userAgentData?.mobile !== undefined) {
			// @ts-expect-error - navigator.userAgentData is experimental API not in TypeScript types
			return navigator.userAgentData.mobile;
		}

		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	}

	private handleDocumentClick: ((e: MouseEvent) => void) | null = null;
});
