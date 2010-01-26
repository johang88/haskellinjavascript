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
			if (symbol instanceof Array) { 
				// Special case caused when there are parantheses present because sequence returns an array in that case,
				// I think that sequence should fail when there are no parantheses but it does not for some reason.
				return interpret(env, symbol[0]);
			} else {
				return symbol;
			}
			
			break;
	}
}