import { requestsTrack } from './requests';
import { performanceTrack } from './performance';
import { scalingTrack } from './scaling';
import { storingTrack } from './storing';
import { distributedTrack } from './distributed';
import { communicationTrack } from './communication';
import { reliabilityTrack } from './reliability';
import { architectureTrack } from './architecture';
import { securityTrack } from './security';
import { shippingTrack } from './shipping';
import { wholeSystemsTrack } from './whole-systems';
import { basicsSystem } from './core';

/** The tracks, in order. */
const modules = [
	requestsTrack,
	performanceTrack,
	scalingTrack,
	storingTrack,
	distributedTrack,
	communicationTrack,
	reliabilityTrack,
	architectureTrack,
	securityTrack,
	shippingTrack,
	wholeSystemsTrack,
];

export const basics = basicsSystem(modules);
