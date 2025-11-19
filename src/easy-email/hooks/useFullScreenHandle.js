import { useCallback, useEffect, useMemo, useState } from 'react';
import fscreen from 'fscreen';

export function useFullScreenHandle() {
	const [active, setActive] = useState(false);

	useEffect(() => {
		const handleChange = () => {
			const active = fscreen.fullscreenElement === document.body;
			setActive(active);
			document.body.classList.toggle('fullscreen-enabled', active);
		};
		fscreen.addEventListener('fullscreenchange', handleChange);
		return () => fscreen.removeEventListener('fullscreenchange', handleChange);
	}, []);

	const enter = useCallback(() => {
		if (fscreen.fullscreenElement) {
			return fscreen.exitFullscreen().then(() => fscreen.requestFullscreen(document.body));
		}

		return fscreen.requestFullscreen(document.body);
	}, []);

	const exit = useCallback(() => {
		if (fscreen.fullscreenElement === document.body) {
			return fscreen.exitFullscreen();
		}

		return Promise.resolve();
	}, []);

	const toggle = active ? exit : enter;

	return useMemo(
		() => ({
			active,
			enter,
			exit,
			toggle,
		}),
		[active, enter, exit],
	);
}
