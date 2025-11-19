define(['views/fields/varchar'], Dep =>
	class extends Dep {
		override editTemplate = 'autocrm:fields/sequence-number/edit';

		override type = 'sequenceNumber';
		allowCustomValue = false;
		isCustomValue = false;
		$checkbox: JQuery<HTMLElement> | null = null;
		$input: JQuery<HTMLElement> | null = null;

		override setup() {
			super.setup();

			this.isCustomValue = this.model.get(this.name + 'IsCustomValue') as boolean;

			if ('allowCustomValue' in this.params) {
				this.allowCustomValue = this.params.allowCustomValue as boolean;
			}

			if (!this.allowCustomValue) {
				if (!this.readOnly) {
					this.setReadOnly(true);
				}
			} else {
				this.listenToOnce(this, 'edit', () => {
					this.toggleInput();
				});
			}
		}

		override afterRenderEdit() {
			super.afterRenderEdit();
			this.$checkbox = this.$el.find('input[data-name="' + this.name + 'IsCustomValue"]');
			this.$input = this.$el.find(`input[data-name="${this.name}"]`);

			this.toggleInput();

			this.$checkbox.on('change', () => {
				this.isCustomValue = this.$checkbox?.is(':checked') as boolean;
				this.toggleInput();
			});
		}

		toggleInput(): void {
			this.$input!.prop('disabled', !this.isCustomValue);
		}

		override fetch() {
			const data = super.fetch();

			if (this.allowCustomValue) {
				data[this.name + 'IsCustomValue'] = this.isCustomValue;
			}

			return data;
		}

		override data() {
			return {
				...super.data(),
				isCustomValue: this.isCustomValue,
			};
		}
	});
