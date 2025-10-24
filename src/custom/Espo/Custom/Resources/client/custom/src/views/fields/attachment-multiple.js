define('custom:views/fields/attachment-multiple', ['views/fields/attachment-multiple'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            this.listenTo(this.model, 'change:' + this.idsName, function () {
                if (this.isRendered() && this.mode === 'detail') {
                    this.reRender();
                }
            }, this);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            if (this.mode === 'detail') {
                this.addZipButton();
            }
        },

        addZipButton: function () {
            var ids = this.model.get(this.idsName);
           
            if (!ids || ids.length === 0) {
                return;
            }

            // Try to find any container
            var $list = this.$el.find('.attachment-list');

            var existingBtn = this.$el.find('[data-action="downloadZip"]');
            if (existingBtn.length) {
                return;
            }

            var $btn = $('<div style="margin-bottom: 5px;">' +
                '<button type="button" class="btn btn-default btn-sm zip-download-btn" title="Download as ZIP">' +
                '<span class="fas fa-file-archive"></span> Stáhnout přílohy' +
                '</button>' +
                '</div>');

            if ($list.length) {
                $list.before($btn);
            } else {
                this.$el.prepend($btn);
            }

            // Add click event listener
            var self = this;
            this.$el.find('.zip-download-btn').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.actionDownloadZip();
            });
        },

        actionDownloadZip: function () {
            var ids = this.model.get(this.idsName);

            if (!ids || ids.length === 0) {
                Espo.Ui.warning(this.translate('No attachments to download', 'messages'));
                return;
            }

            this.notify('Stahuji ' + ids.length + ' položek...');

            var entityType = this.model.entityType || this.model.name;
            var entityId = this.model.id;
            var field = this.name;

            var basePath = this.getBasePath();
            if (!basePath || basePath === '') {
                basePath = '/';
            } else if (basePath.slice(-1) !== '/') {
                basePath += '/';
            }

            var url = basePath + 'api/v1/Attachment/action/downloadFieldZip' +
                '?entityType=' + entityType +
                '&entityId=' + entityId +
                '&field=' + field;

            window.location.href = url;

            setTimeout(function () {
                this.notify(false);
            }.bind(this), 2000);
        }

    });
});
