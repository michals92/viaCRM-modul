export default function useExportTemplate() {
	return {
		exportTemplate: (name, page) => {
			const data = new Blob([page], { type: 'text/html' });
			const url = window.URL.createObjectURL(data);
			const link = document.createElement('a');

			link.download = name;
			link.href = url;
			link.dispatchEvent(new MouseEvent('click'));
		},
	};
}
