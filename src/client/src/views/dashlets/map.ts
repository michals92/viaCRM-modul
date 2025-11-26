/// <reference types="google.maps" />

import type Collection from 'espocrm/src/collection';
import type Model from 'espocrm/src/model';
import type EspoSearchManager from 'espocrm/src/search-manager';
import type { AdvancedFilter, SearchManagerData } from 'espocrm/src/search-manager';

interface AddressData {
	street?: string;
	city?: string;
	state?: string;
	postalCode?: string;
	country?: string;
}

define(['views/dashlets/abstract/base', 'viacrm:helpers/version'], (Dep, VersionHelper) => class extends Dep {
	override template = 'viacrm:dashlets/map';

	entityType: string | null = null;

	//@ts-ignore this will always be set for us
	collection: Collection;

	addressField = null;

	height = 'auto';

	fields = ['street', 'city', 'state', 'postalCode', 'country'];

	errorMsg: string | null = null;

	zoomLevel = 8;

	mapCenter = null;

	hasErrorHappened = false;

	searchManager: EspoSearchManager | null = null;

	$map: JQuery | null = null;

	geocoder: google.maps.Geocoder | null = null;

	map: google.maps.Map | null = null;

	markers: google.maps.Marker[] = [];

	override setup() {
		super.setup();

		this.wait(true);

		this.mapCenter = this.getOption('mapCenter');

		this.entityType = this.getOption('entityType') || this.entityType;

		if (!this.entityType) {
			this.displayError('selectEntityType');
			this.wait(false);
			return;
		}

		this.addressField = this.getOption('addressField') || this.addressField;

		if (!this.addressField) {
			this.displayError('selectAddressField');
			this.wait(false);
			return;
		}

		this.getCollectionFactory().create(this.entityType, collection => {
			this.collection = collection;
			collection.whereAdditional = [
				{
					type: 'isNotNull',
					attribute: this.addressField + 'Lat',
				},
				{
					type: 'isNotNull',
					attribute: this.addressField + 'Lng',
				},
			];

			collection.data.select = this.getSelectAttributeList().join(',');

			const displayRecords = this.getOption('displayRecords');
			if (displayRecords) {
				collection.maxSize = displayRecords;
			}
		});

		this.setupSearchManager();

		this.createView('search', this.getSearchViewName(), {
			// @ts-ignore oof
			el: this.el + ' .search-container',
			collection: this.collection,
			searchManager: this.searchManager,
			scope: this.entityType,
			isWide: true,
		});

		this.collection.fetch().then(this.wait.bind(this, false));

		this.listenTo(this.collection, 'sync', this.drawMarkers.bind(this));
	}

	displayError(key) {
		this.hasErrorHappened = true;
		this.errorMsg = this.translate(key, 'messages', 'DashletOptions');
	}

	getSelectAttributeList() {
		return ['id', 'name', this.addressField + 'Lat', this.addressField + 'Lng'].concat(
			this.fields.map(field => this.addressField + Espo.Utils.upperCaseFirst(field)),
		);
	}

	getSearchViewName(): string {
		return this.getMetadata().get<string>(
			['clientDefs', this.entityType as string, 'recordViews', 'search'],
			'views/record/search',
		);
	}

	setupSearchManager() {
		const collection = this.collection;

		const searchManager = (new VersionHelper(this.getConfig())).createSearchManager(
			collection,
			'list',
			this.getStorage(),
			this.getDateTime(),
			this.getSearchDefaultData(),
		);

		searchManager.scope = this.entityType as string;

		searchManager.loadStored();

		collection.where = searchManager.getWhere();

		this.searchManager = searchManager;
	}

	getSearchDefaultData(): SearchManagerData {
		const defaultSearchData: SearchManagerData =
				this.getMetadata().get<SearchManagerData>([
					'clientDefs',
					this.entityType as string,
					'defaultFilterData',
				]) || {};

		const defaultAdvancedFilters =
				this.getMetadata().get<Record<string, AdvancedFilter>>([
					'clientDefs',
					this.entityType as string,
					'defaultAdvancedFilters',
				]) || {};

		if (Object.keys(defaultAdvancedFilters).length) {
			defaultSearchData.advanced = defaultAdvancedFilters;
		}

		return defaultSearchData;
	}

	override afterRender() {
		if (this.hasErrorHappened) {
			this.$el.find('.map').html(this.errorMsg as string);
			return;
		}
		this.$map = this.$el.find('.map');

		this.processSetHeight(true);

		if (this.height === 'auto') {
			$(window).off('resize.' + this.cid);
			$(window).on('resize.' + this.cid, this.processSetHeight.bind(this));
		}

		this.afterRenderGoogle();
	}

	afterRenderGoogle() {
		if (window.google && window.google.maps) {
			this.initMapGoogle();
			// @ts-ignore oof
		} else if (typeof window.mapapiloaded === 'function') {
			// @ts-ignore oof
			const mapapiloaded = window.mapapiloaded;
			// @ts-ignore oof
			window.mapapiloaded = () => {
				this.initMapGoogle();
				mapapiloaded();
			};
		} else {
			// @ts-ignore oof
			window.mapapiloaded = () => this.initMapGoogle();

			let src = 'https://maps.googleapis.com/maps/api/js?callback=mapapiloaded';
			const apiKey = this.getApiKey();
			if (apiKey) {
				src += '&key=' + apiKey;
			}

			const s = document.createElement('script');
			s.setAttribute('async', 'async');
			s.src = src;
			document.head.appendChild(s);
		}
	}

	getApiKey() {
		return this.getConfig().get('googleMapsApiKey');
	}

	initMapGoogle() {
		this.geocoder = new google.maps.Geocoder();

		try {
			this.map = new google.maps.Map(this.$el.find('.map').get(0) as HTMLElement, {
				zoom: this.zoomLevel,
				center: { lat: 0, lng: 0 },
				scrollwheel: false,
			});

			this.centerMap();
			this.drawMarkers();
		} catch (e: any) {
			console.error(e.message);
		}
	}

	centerMap() {
		(this.geocoder as any).geocode({ address: this.mapCenter }, (results, status) => {
			if (status === google.maps.GeocoderStatus.OK)
				(this.map as google.maps.Map).setCenter(results[0].geometry.location);
		});
	}

	drawMarkers() {
		this.clearMap();

		const markers: google.maps.Marker[] = [];

		this.collection.forEach(model => {
			const position = {
				lat: model.get(this.addressField + 'Lat') as number,
				lng: model.get(this.addressField + 'Lng') as number,
			};

			const marker = new google.maps.Marker({
				map: this.map,
				position,
			});

			const infoWindow = new google.maps.InfoWindow({
				content: this.getInfoWindowHtml(model),
			});

			this.addMarkerListeners(marker, infoWindow, model);

			markers.push(marker);
		});

		this.markers = markers;

		this.updateCount();
	}

	updateCount() {
		this.$el.find('.search-row > div:last-child').html(
			$('<div>', {
				class: 'pull-right total-count text-muted',
				text: this.translate('Total') + ': ' + this.collection.total,
			}).prop('outerHTML'),
		);
	}

	clearMap() {
		this.markers.forEach(marker => marker.setMap(null));
	}

	addMarkerListeners(marker: google.maps.Marker, infoWindow: google.maps.InfoWindow, model: Model) {
		marker.addListener('mouseover', infoWindow.open.bind(infoWindow, this.map, marker));
		marker.addListener('mouseout', infoWindow.close.bind(infoWindow));

		marker.addListener('click', () =>
			this.getRouter().navigate('#' + this.entityType + '/view/' + model.id, { trigger: true }),
		);
	}

	getInfoWindowHtml(model: Model) {
		const name = model.get('name') || '';
		const address = this.composeAddress(model);

		const nameLabel = this.translate('name', 'fields', this.entityType as string);
		const addressLabel = this.translate('address', 'fields', this.entityType as string);

		return `${nameLabel}: ${name}<br/>${addressLabel}: ${address}`;
	}

	composeAddress(model: Model) {
		let address = '';
		const addressData: AddressData = {};

		this.fields.forEach(field => {
			addressData[field] = model.get<string>(this.addressField + Espo.Utils.upperCaseFirst(field));
		});

		if (addressData.street) {
			address += addressData.street;
		}

		if (addressData.city) {
			if (address !== '') {
				address += ', ';
			}
			address += addressData.city;
		}

		if (addressData.state) {
			if (address !== '') {
				address += ', ';
			}
			address += addressData.state;
		}

		if (addressData.postalCode) {
			if (addressData.state || addressData.city) {
				address += ' ';
			} else {
				if (address) {
					address += ', ';
				}
			}
			address += addressData.postalCode;
		}

		if (addressData.country) {
			if (address !== '') {
				address += ', ';
			}
			address += addressData.country;
		}

		return address;
	}

	processSetHeight(init) {
		const height = this.height;

		if (this.height === 'auto') {
			const heightNum: number = this.$el.parent().height() as number;

			if (init && heightNum <= 0) {
				setTimeout(this.processSetHeight.bind(this, true), 50);
				return;
			}
		}

		(this.$map as JQuery).css('height', height + 'px');
	}
});
