define(['views/record/panels/side'], function (PanelView) {
    'use strict';

    return class extends PanelView {
        
        setup() {
            this.template = 'viacrm:email-template/panels/easy-email-options';
            super.setup();
            
            this.createField('useEasyEmailEditor');
            
            // Listen for changes
            this.listenTo(this.model, 'change:useEasyEmailEditor', () => {
                this.updatePanelVisibility();
            });
        }

        afterRender() {
            super.afterRender();
            this.updatePanelVisibility();
        }

        updatePanelVisibility() {
            const useEasyEmail = this.model.get('useEasyEmailEditor');
            const $info = this.$el.find('.easy-email-info');
            
            if (useEasyEmail) {
                $info.show();
            } else {
                $info.hide();
            }
        }

        data() {
            return {
                ...super.data(),
                useEasyEmail: this.model.get('useEasyEmailEditor'),
                hasBodyMjml: !!this.model.get('bodyMjml'),
                hasBody: !!this.model.get('body')
            };
        }
    };
});