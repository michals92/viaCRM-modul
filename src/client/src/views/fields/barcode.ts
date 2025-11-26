import type VarcharFieldView from 'espocrm/src/views/fields/varchar';
import type Model from 'espocrm/src/model';

declare global {
	interface Window {
		JsBarcode?: (element: SVGSVGElement, text: string, options: Record<string, unknown>) => void;
		QRCode?: new (element: HTMLElement, options: Record<string, unknown>) => void;
	}
}

interface QRCodeConstructor {
	new(element: HTMLElement, options: Record<string, unknown>): void;
	CorrectLevel: { H: number };
}

define(
	'viacrm:views/fields/barcode',
	['views/fields/varchar'],
	(Dep: typeof VarcharFieldView) => class extends Dep {
		override type = 'barcode';

		override listTemplate = 'fields/barcode/detail';
		override detailTemplate = 'fields/barcode/detail';

		isSvg = false;
		retriedBarcode = false;
		declare model: Model;
		declare name: string;
		declare mode: string;
		declare cid: string;
		declare params: { trim?: boolean; codeType?: string; maxLength?: number };

		override setup(): void {
			this.params.trim = true;
			this.params.codeType = this.params.codeType || 'CODE128';

			let maxLength = 255;

			switch (this.params.codeType) {
				case 'EAN2':
					maxLength = 2; break;
				case 'EAN5':
					maxLength = 5; break;
				case 'EAN8':
					maxLength = 8; break;
				case 'EAN13':
					maxLength = 13; break;
				case 'UPC':
					maxLength = 12; break;
				case 'UPCE':
					maxLength = 11; break;
				case 'ITF14':
					maxLength = 14; break;
				case 'pharmacode':
					maxLength = 6; break;
			}

			this.params.maxLength = maxLength;

			if (this.params.codeType !== 'QRcode') {
				this.isSvg = true;
			}

			Dep.prototype.setup.call(this);

			this.loadBarcodeLibraries();

			$(window).on('resize.' + this.cid, () => {
				if (!this.isRendered()) return;
				this.controlWidth();
			});
		}

		loadBarcodeLibraries(): void {
			if (this.params.codeType !== 'QRcode' && !window.JsBarcode) {
				this.loadScript('client/custom/modules/viacrm/lib/JsBarcode.all.min.js');
			}
			if (this.params.codeType === 'QRcode' && !window.QRCode) {
				this.loadScript('client/custom/modules/viacrm/lib/qrcode.min.js');
			}
		}

		loadScript(src: string): void {
			const script = document.createElement('script');
			script.src = src;
			script.async = true;
			document.head.appendChild(script);
		}

		override onRemove(): void {
			$(window).off('resize.' + this.cid);
		}

		override afterRender(): void {
			Dep.prototype.afterRender.call(this);

			if (this.mode === 'list' || this.mode === 'detail') {
				const value = this.model.get(this.name) as string;
				if (value) {
					setTimeout(() => {
						this.renderBarcode(value);
					}, 100);
				}
				this.controlWidth();
			}
		}

		renderBarcode(value: string): void {
			const $barcode = this.$el.find('.barcode');
			if ($barcode.length === 0) return;

			if (this.params.codeType === 'QRcode') {
				if (typeof window.QRCode !== 'undefined') {
					try {
						$barcode.empty();
						const size = this.mode === 'list' ? 64 : 128;
						new (window.QRCode as QRCodeConstructor)($barcode.get(0) as HTMLElement, {
							text: value,
							width: size,
							height: size,
							colorDark: '#000000',
							colorLight: '#ffffff',
							correctLevel: (window.QRCode as QRCodeConstructor).CorrectLevel.H,
						});
					} catch (_e) {
						this.renderFallback($barcode, value);
					}
				} else {
					this.renderFallback($barcode, value);
				}
			} else {
				if (typeof window.JsBarcode !== 'undefined') {
					try {
						$barcode.empty();

						const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
						$barcode.append(svg);

						const format = this.params.codeType || 'CODE128';

						const formatMap: Record<string, string> = {
							'CODE128': 'CODE128',
							'CODE128A': 'CODE128A',
							'CODE128B': 'CODE128B',
							'CODE128C': 'CODE128C',
							'EAN13': 'EAN13',
							'EAN8': 'EAN8',
							'EAN5': 'EAN5',
							'EAN2': 'EAN2',
							'UPC': 'UPC',
							'UPCE': 'UPC_E',
							'ITF14': 'ITF14',
							'ITF': 'ITF',
							'MSI': 'MSI',
							'MSI10': 'MSI10',
							'MSI11': 'MSI11',
							'MSI1010': 'MSI1010',
							'MSI1110': 'MSI1110',
							'pharmacode': 'pharmacode',
							'codabar': 'codabar',
						};

						const barcodeFormat = formatMap[format] || 'CODE128';

						window.JsBarcode!(svg, value, {
							format: barcodeFormat,
							width: 2,
							height: this.mode === 'list' ? 40 : 60,
							displayValue: true,
							fontSize: 12,
							margin: 5,
							background: '#ffffff',
							lineColor: '#000000',
						});
					} catch (_e) {
						this.renderFallback($barcode, value);
					}
				} else {
					if (!this.retriedBarcode) {
						this.retriedBarcode = true;
						this.loadScript('client/custom/modules/viacrm/lib/JsBarcode.all.min.js');
						setTimeout(() => {
							this.renderBarcode(value);
						}, 500);
					} else {
						this.renderFallback($barcode, value);
					}
				}
			}
		}

		renderFallback($barcode: JQuery, value: string): void {
			$barcode.html(
				'<div style="font-family: monospace; font-size: 14px; padding: 5px; border: 1px solid #ddd; background: #f9f9f9; display: inline-block;">' +
				'<div style="font-size: 10px; color: #666; margin-bottom: 2px;">' + this.params.codeType + '</div>' +
				'<div>' + this.getHelper().escapeString(value) + '</div>' +
				'</div>',
			);
		}

		controlWidth(): void {
			this.$el.find('.barcode').css('max-width', this.$el.width() + 'px');
		}
	},
);
