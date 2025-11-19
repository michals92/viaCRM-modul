import type RecordView from 'espocrm/src/views/record/base';

extend(
	Dep =>
		class extends Dep {
			_getUnresolvedPlaceholderTokens(): string[] {
				const rv = this.getRecordView() as RecordView | null;
				const model = rv?.model ?? this.model;
				const body = model?.get('body') ?? '';
				const isHtml = model?.get('isHtml') ?? true;

				let text = body;
				if (isHtml) {
					const $div = $('<div>').html(text);
					$div.find('style,link[rel="stylesheet"],script,template').remove();
					text = $div.text();
				}

				if (text.indexOf('{') === -1) {
					return [];
				}

				/**
				 * {{ ... }} or { ... }
				 */
				const placeholderRegex = /\{\{\s*[^{}]*\s*}}|\{\s*[^{}]*\s*}/g;
				const tokens = new Set(text.match(placeholderRegex) || []);

				return Array.from(tokens) as string[];
			}

			actionSend() {
				const tokens = this._getUnresolvedPlaceholderTokens();
				if (!tokens.length) {
					return super.actionSend();
				}

				const msg = this.translate('unresolvedPlaceholdersConfirm', 'messages', 'Email').replace(
					'{tokens}',
					tokens.slice(0, 5).join(', '),
				);

				return this.confirm({
					message: msg,
					confirmText: this.translate('Send Anyway', 'labels', 'Email'),
					cancelText: this.translate('Cancel'),
				}).then(() => super.actionSend());
			}
		},
);
