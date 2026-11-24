import { foundationsTerms } from './foundations';
import { scalingTerms } from './scaling';
import { storingTerms } from './storing';
import { distributedTerms } from './distributed';
import { communicationTerms } from './communication';
import { reliabilityTerms } from './reliability';
import { architectureTerms } from './architecture';
import { securityTerms } from './security';
import { shippingTerms } from './shipping';
import { wholeSystemsTerms } from './whole-systems';

/** Each track's own words, added to the shared glossary. */
export const trackTerms = [
	...foundationsTerms,
	...scalingTerms,
	...storingTerms,
	...distributedTerms,
	...communicationTerms,
	...reliabilityTerms,
	...architectureTerms,
	...securityTerms,
	...shippingTerms,
	...wholeSystemsTerms,
];
