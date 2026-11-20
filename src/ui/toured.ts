/** Whether this browser has seen the tour, so it only opens by itself once. */
const TOURED_KEY = 'systemscape:toured';

export function hasToured() {
	try {
		return localStorage.getItem(TOURED_KEY) === '1';
	} catch {
		return true;
	}
}

export function markToured() {
	try {
		localStorage.setItem(TOURED_KEY, '1');
	} catch {
		// shown again next time
	}
}
