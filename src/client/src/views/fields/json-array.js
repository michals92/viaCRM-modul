define('viacrm:views/fields/json-array', ['views/fields/base'], function (Dep) {

    return Dep.extend({

        type: 'jsonArray',

        editTemplate: 'viacrm:fields/json-array/edit',
        detailTemplate: 'viacrm:fields/json-array/detail',

        data: function () {
            var data = Dep.prototype.data.call(this);
            data.valueIsSet = this.model.has(this.name);
            data.isNotEmpty = !!this.model.get(this.name);
            
            var value = this.model.get(this.name);
            if (Array.isArray(value)) {
                data.value = value.join(', ');
            } else {
                data.value = value || '';
            }
            
            return data;
        },

        setup: function () {
            Dep.prototype.setup.call(this);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            
            if (this.mode === 'edit') {
                this.initEdit();
            }
        },

        initEdit: function () {
            var $element = this.$element;
            if (!$element || !$element.length) return;
            
            $element.on('change', () => {
                this.trigger('change');
            });
        },

        fetch: function () {
            var value = this.$element.val();
            var data = {};
            
            if (value) {
                try {
                    // Try to parse as JSON array
                    var parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                        data[this.name] = parsed;
                    } else {
                        // If not an array, split by comma
                        data[this.name] = value.split(',').map(s => s.trim()).filter(s => s);
                    }
                } catch (e) {
                    // If JSON parse fails, split by comma
                    data[this.name] = value.split(',').map(s => s.trim()).filter(s => s);
                }
            } else {
                data[this.name] = [];
            }
            
            return data;
        },

        validateRequired: function () {
            if (this.isRequired()) {
                var value = this.model.get(this.name);
                if (!value || !Array.isArray(value) || value.length === 0) {
                    var msg = this.translate('fieldIsRequired', 'messages').replace('{field}', this.getLabelText());
                    this.showValidationMessage(msg);
                    return true;
                }
            }
        },

        showValidationMessage: function (message) {
            var $label = this.$label;
            var $el = this.$element;
            
            $el.addClass('has-error');
            
            if ($label.length) {
                $label.addClass('has-error');
            }
            
            if ($el.length) {
                $el.popover({
                    placement: 'bottom',
                    container: 'body',
                    content: message,
                    trigger: 'manual'
                }).popover('show');
                
                var hide = () => {
                    $el.popover('destroy');
                    $el.removeClass('has-error');
                    if ($label.length) {
                        $label.removeClass('has-error');
                    }
                };
                
                $el.one('click', hide);
                setTimeout(hide, 3000);
            }
        }
    });
});