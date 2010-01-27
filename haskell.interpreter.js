function isInteger(x) {
	var y = parseInt(x);
	if (isNaN(y)) {
		return false;
	}
	return x== y && x.toString() == y.toString();
}

haskell.interpreter.interpret = function(env, ast) {	
	var interpret = haskell.interpreter.interpret;
	
	if (ast.arguments != undefined) {
		for (var i = 0; i < ast.arguments.length; i++) {
			var arg = ast.arguments[i];
			env.set_symbol(arg, prompt("enter a value for " + arg));
		}
		
		return interpret(env, ast.expr);
	} else if (ast.symbol != undefined) {
		switch (ast.symbol) {
			case '+':
				return interpret(env, ast.lhs) + interpret(env, ast.rhs);
				break;
			case '-':
				return interpret(env, ast.lhs) - interpret(env, ast.rhs);
				break;
			case '*':
				return interpret(env, ast.lhs) * interpret(env, ast.rhs);
				break;
			case '/':
				return interpret(env, ast.lhs) / interpret(env, ast.rhs);
				break;
			default:
				console.log("unknown symbol %o     ast: %o", ast.symbol, ast);
				break;
		}
	} else {
		if (isInteger(ast)) {
			return ast;
		} else { 
			// ast is a symbol so look it up
			var ast2 = haskell.parser.parse(env.get_symbol(ast), true).ast;
			var result = interpret(new haskell.env(), ast2);
			return result;
		}
	}
}