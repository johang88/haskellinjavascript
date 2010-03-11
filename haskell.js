var haskell = {
	parser: {},
	interpreter: {},
	ast: {},
	typechecker: {}
};

haskell.env = function() {
	this.symbols = {};
	this.arg_list = {};
	
	this.set_symbol = function(symbol, value, evaluated) {
		var s = {};
		s.value = value;
		s.evaluated = evaluated == undefined ? false : evaluated;
		
		this.symbols[symbol] = s;
	}
	
	this.get_symbol = function(symbol) {
		return this.symbols[symbol];
	}
	
	this.exists_symbol = function(symbol) {
		return this.symbols[symbol] != undefined;
	}
	
	this.set_arg_list = function(args) {
		this.arg_list = args;
	}
}

haskell.eval = function(code) {
	if (typeof(console) == "undefined") {
		console = {};
		console.log = function() {};
	}
	
	var ast = haskell.parser.parse(code).ast;
	console.log("%o", ast);
	return haskell.interpreter.interpret(new haskell.env(), ast);
};
