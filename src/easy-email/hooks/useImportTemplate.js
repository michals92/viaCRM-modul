import { MjmlToJson } from 'easy-email-extensions';

export default function useImportTemplate() {
	return {
		importTemplate: async () => {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '*';
			input.multiple = false;

			const [file, template] = await new Promise((resolve, reject) => {
				input.addEventListener('change', () => {
					const file = input.files[0];
					const reader = new FileReader();
					reader.onload = event => {
						if (!event.target) {
							reject();
							return;
						}

						resolve([file, reader.result]);
					};
					reader.readAsText(file);
				});
				input.dispatchEvent(new MouseEvent('click'));
			});

			return [file.name, MjmlToJson(template)];
		},
	};
}
