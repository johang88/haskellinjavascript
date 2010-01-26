var haskell = {
	parser: {},
	interpreter: {}
};

haskell.eval = function(code) {
	return(haskell.parser.parse(code));
};