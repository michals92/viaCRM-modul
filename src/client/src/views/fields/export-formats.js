define('viacrm:views/fields/export-formats', ['views/fields/multi-enum'], function (Dep) {

    return Dep.extend({

        type: 'exportFormats',

        setup: function () {
            Dep.prototype.setup.call(this);
            
            // Set available export format options
            this.params.options = ['CSV', 'Excel', 'PDF'];
            this.translatedOptions = {
                'CSV': 'CSV',
                'Excel': 'Excel (XLSX)',
                'PDF': 'PDF'
            };
        },

        fetch: function () {
            const data = Dep.prototype.fetch.call(this);
            // Ensure we always have at least CSV as default
            if (!data[this.name] || !Array.isArray(data[this.name]) || data[this.name].length === 0) {
                data[this.name] = ['CSV'];
            }
            return data;
        }
    });
});