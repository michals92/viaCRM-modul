define('viacrm:views/fields/barcode', ['views/fields/varchar'], function (Dep) {

    return Dep.extend({

        type: 'barcode',

        listTemplate: 'fields/barcode/detail',

        detailTemplate: 'fields/barcode/detail',

        setup: function () {
            this.params.trim = true;
            this.params.codeType = this.params.codeType || 'CODE128';

            var maxLength = 255;

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

            // Load barcode libraries dynamically
            this.loadBarcodeLibraries();

            $(window).on('resize.' + this.cid, function () {
                if (!this.isRendered()) return;
                this.controlWidth();
            }.bind(this));
        },

        loadBarcodeLibraries: function () {
            // Load JsBarcode for regular barcodes
            if (this.params.codeType !== 'QRcode' && !window.JsBarcode) {
                this.loadScript('client/custom/modules/viacrm/lib/JsBarcode.all.min.js');
            }
            // Load QRCode for QR codes
            if (this.params.codeType === 'QRcode' && !window.QRCode) {
                this.loadScript('client/custom/modules/viacrm/lib/qrcode.min.js');
            }
        },

        loadScript: function (src) {
            var script = document.createElement('script');
            script.src = src;
            script.async = true;
            document.head.appendChild(script);
        },

        onRemove: function () {
            $(window).off('resize.' + this.cid);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            if (this.mode === 'list' || this.mode === 'detail') {
                var value = this.model.get(this.name);
                if (value) {
                    // Wait a bit for libraries to load
                    setTimeout(function () {
                        this.renderBarcode(value);
                    }.bind(this), 100);
                }
                this.controlWidth();
            }
        },

        renderBarcode: function (value) {
            var $barcode = this.$el.find('.barcode');
            if ($barcode.length === 0) return;

            if (this.params.codeType === 'QRcode') {
                // Render QR Code
                if (typeof QRCode !== 'undefined') {
                    try {
                        $barcode.empty();
                        var size = this.mode === 'list' ? 64 : 128;
                        new QRCode($barcode.get(0), {
                            text: value,
                            width: size,
                            height: size,
                            colorDark: '#000000',
                            colorLight: '#ffffff',
                            correctLevel: QRCode.CorrectLevel.H
                        });
                    } catch (e) {
                        console.error('QR Code error:', e);
                        this.renderFallback($barcode, value);
                    }
                } else {
                    console.log('QRCode library not loaded yet');
                    this.renderFallback($barcode, value);
                }
            } else {
                // Render regular barcode
                if (typeof JsBarcode !== 'undefined') {
                    try {
                        // Clear the element first
                        $barcode.empty();
                        
                        // Create SVG element for barcode
                        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                        $barcode.append(svg);
                        
                        var format = this.params.codeType || 'CODE128';
                        
                        // Fix format mapping
                        var formatMap = {
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
                            'codabar': 'codabar'
                        };
                        
                        var barcodeFormat = formatMap[format] || 'CODE128';
                        
                        console.log('Generating barcode with format:', barcodeFormat, 'value:', value);
                        
                        JsBarcode(svg, value, {
                            format: barcodeFormat,
                            width: 2,
                            height: this.mode === 'list' ? 40 : 60,
                            displayValue: true,
                            fontSize: 12,
                            margin: 5,
                            background: '#ffffff',
                            lineColor: '#000000'
                        });
                    } catch (e) {
                        console.error('Barcode generation error:', e);
                        this.renderFallback($barcode, value);
                    }
                } else {
                    console.log('JsBarcode library not loaded yet, retrying...');
                    // Try to load again and retry
                    if (!this.retriedBarcode) {
                        this.retriedBarcode = true;
                        this.loadScript('client/custom/modules/viacrm/lib/JsBarcode.all.min.js');
                        setTimeout(function() {
                            this.renderBarcode(value);
                        }.bind(this), 500);
                    } else {
                        this.renderFallback($barcode, value);
                    }
                }
            }
        },

        renderFallback: function ($barcode, value) {
            // Fallback rendering when libraries aren't loaded
            $barcode.html(
                '<div style="font-family: monospace; font-size: 14px; padding: 5px; border: 1px solid #ddd; background: #f9f9f9; display: inline-block;">' +
                '<div style="font-size: 10px; color: #666; margin-bottom: 2px;">' + this.params.codeType + '</div>' +
                '<div>' + this.getHelper().escapeString(value) + '</div>' +
                '</div>'
            );
        },

        controlWidth: function () {
            this.$el.find('.barcode').css('max-width', this.$el.width() + 'px');
        },

    });
});