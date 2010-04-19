(function(utilities){
    utilities.expectType = function(o,t) {
	if (!(o instanceof t)) {
	    throw new Error("Expected " + typeof t + " " + typeof o + " given.");
        };
    };

    utilities.expectTypeOf = function(o, t) {
	if ((typeof o) != t) {
	    throw new Error("Expected " + t + ", " + typeof o + " given.");
	};
    };

    utilities.expectTypeArray = function(os, t) {
	for (i in os) {
	    if (!(os[i] instanceof t)) {
		throw new Error("Expected " + typeof t + ", " + typeof os[i] + " given at index " + i);
	    };
	};
    };
})(haskell.utilities);