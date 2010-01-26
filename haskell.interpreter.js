haskell.interpreter.interpret = function(env, ast) {	
	var interpret = haskell.interpreter.interpret;
	
	var symbol = ast.symbol == undefined ? ast : ast.symbol;

	switch (symbol) {
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
			return symbol;
			break;
	}
}