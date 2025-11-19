define(['views/fields/base'], (Dep: any) =>
	class extends Dep {
		detailTemplateContent = '{{{value}}}';
		editTemplateContent = '{{{value}}}';

		getValueForDisplay(): string {
			const turnoverInfo = this.model.get(this.name) as Record<string, { value: any }> | null | undefined;

			if (!turnoverInfo || Object.keys(turnoverInfo).length === 0) {
				return this.translate('None');
			}

			const list = Object.entries(turnoverInfo).map(([year, data]) => {
				const label = `${year}: ${data.value} Kč`;
				return $('<span>').text(label).get(0)!.outerHTML;
			});

			return list.join('<br>');
		}

		fetch(): Record<string, unknown> {
			const value = this.model.get(this.name);
			return value ? { [this.name]: value } : {};
		}
	});
