var haskell = {
	parser: {},
	interpreter: {}
};

haskell.env = function() {
	this.symbols = {};
	
	this.set_symbol = function(symbol, value) {
		this.symbols[symbol] = value;
	}
	
	this.get_symbol = function(symbol) {
		return this.symbols[symbol];
	}
	
	this.exists_symbol = function(symbol) {
		return this.symbols[symbol] != undefined;
	}
}

haskell.eval = function(code) {
	var ast = haskell.parser.parse(code).ast;
	return haskell.interpreter.interpret(new haskell.env(), ast);
};