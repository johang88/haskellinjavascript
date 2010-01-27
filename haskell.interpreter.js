function isInteger(x) {
	var y = parseInt(x);
	if (isNaN(y)) {
		return false;
	}
	return x== y && x.toString() == y.toString();
}

haskell.interpreter.interpret = function(env, ast) {	
	var interpret = haskell.interpreter.interpret;
	
	if(ast.fun_name != undefined) {
		// eval function
		var f = env.get_symbol(ast.fun_name);
		env.set_arg_list(ast.arguments);
		var result = interpret(env, f.value);
		return result;
	} if (ast.arguments != undefined) {
		for (var i = 0; i < ast.arguments.length; i++) {
			var arg = ast.arguments[i];
			
			if (env.arg_list.length > i) {
				var value = env.arg_list[i];
				value = value.toString();
				value = haskell.parser.parse(value, true).ast;
				env.set_symbol(arg, value, false);
			} else if (!env.exists_symbol(arg)) {
				var value = prompt("enter a value for " + arg);
				value = haskell.parser.parse(value, false).ast;
				env.set_symbol(arg, value, false);
			}
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
			var symbol = env.get_symbol(ast);
			if (symbol.evaluated) {
				return symbol.value;
			} else {
				var result = interpret(new haskell.env(), symbol.value);
				env.set_symbol(ast, result, true);
				return result;
			}
		}
	}
}