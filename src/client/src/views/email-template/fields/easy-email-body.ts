/* global EasyEmailEditor:readonly */

define(['views/fields/text', 'views/fields/wysiwyg', 'lib!easy-email'], (Dep, Wysiwyg) => class extends Dep {
	override detailTemplate = 'autocrm:email-template/fields/body-easy-email/detail';

	override editTemplate = 'autocrm:email-template/fields/body-easy-email/edit';

	useIframe = true;

	editorHeight = '800px';

	override getAttributeList() {
		return ['body', 'bodyMjml'];
	}

	override setup() {
		super.setup();

		this.listenToInsertField();
	}

	listenToInsertField() {
		this.listenTo(this.model, 'insert-field', data => {
			if (!this.editor) {
				return;
			}

			const tag = '{' + data.entityType + '.' + data.field + '}';
			const content = this.editor.getContent();

			content.children.unshift({
				type: 'advanced_text',
				data: { value: { content: tag } },
				attributes: {},
				children: [],
			});

			this.editor.setContent(content);
		});
	}

	override afterRender() {
		super.afterRender();

		if (this.isEditMode() && this.model.get('type') === 'EasyEmail') {
			this.$editor = this.$el.find('.easy-email-editor');
			this.enableEasyEmailEditor();
		}

		if (this.isReadMode()) {
			this.renderDetail();
		}
	}

	override onRemove() {
		if (this.editor) {
			this.editor.unmount();
		}
	}

	getLocale() {
		return this.getConfig().get('language').substring(0, 2);
	}

	getTranslations() {
		const data = this.getLanguage().data;

		if (!('EmailTemplate' in data)) {
			return {};
		}

		return data.EmailTemplate.easyEmailEditorLabels || {};
	}

	enableEasyEmailEditor() {
		this.editor = EasyEmailEditor.render(this.$editor[0], {
			height: this.editorHeight,
			mjmlContent: this.model.get('bodyMjml') || '',
			locale: this.getLocale(),
			translations: this.getTranslations(),
			onChange: () => {
				if (this.isRendered() && this.isEditMode()) {
					this.trigger('change');
				}
			},
			onUploadImage: this.uploadInlineAttachment.bind(this),
		});
	}

	uploadInlineAttachment(file) {
		const orgName = this.name;
		this.name = 'body';
		return Wysiwyg.prototype.uploadInlineAttachment.call(this, file).then(attachment => {
			this.name = orgName;
			return '?entryPoint=attachment&id=' + attachment.id;
		});
	}

	isPlain() {
		if (Wysiwyg.prototype.isPlain) {
			return Wysiwyg.prototype.isPlain.call(this);
		} else {
			return !this.isHtml();
		}
	}

	renderDetail() {
		const orgName = this.name;
		this.name = 'body';
		Wysiwyg.prototype.renderDetail.call(this);
		this.name = orgName;
	}

	override getValueForDisplay() {
		return this.model.get('body');
	}

	sanitizeHtml(html) {
		return Wysiwyg.prototype.sanitizeHtml.call(this, html);
	}

	htmlHasColors(html) {
		return Wysiwyg.prototype.htmlHasColors.call(this, html);
	}

	override fetch() {
		const data = {};

		if (this.editor) {
			data.body = this.sanitizeHtml(this.editor.getHtml());
			data.bodyMjml = this.editor.getMjml();
		}

		return data;
	}

	/** For Wysiwyg.prototype.renderDetail.call(this) to work correctly in 8.4.0 */
	isHtml() {
		return true;
	}

	/** For Wysiwyg.prototype.renderDetail.call(this) to work correctly in 8.4.0 */
	getValueForIframe() {
		return this.sanitizeHtml(this.model.get(this.name) || '');
	}
});
