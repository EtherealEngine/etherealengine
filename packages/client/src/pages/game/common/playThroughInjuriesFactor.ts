
const PERFORMANCE_FRACTION_DECREASE_PER_DAY = 0.025;

const playThroughInjuriesFactor = (playThroughInjuries: number) => {
	return 1 - PERFORMANCE_FRACTION_DECREASE_PER_DAY * playThroughInjuries;
};

export default playThroughInjuriesFactor;
