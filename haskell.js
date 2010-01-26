var haskell = {
	parser: {},
	interpreter: {}
};

haskell.eval = function(code) {
	var ast = haskell.parser.parse(code).ast;
	return haskell.interpreter.interpret(undefined, ast);
};