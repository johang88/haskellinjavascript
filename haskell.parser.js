// The parser

/**
 **** Lambda Calculus Language Grammar ****
 * Program := [Func]
 * 
 * Func := "\\" [Ident] "->" Expr
 *
 * Expr := Ident
 * Expr := Integer
 * Expr := Expr "+" Expr
 * Expr := Expr "-" Expr
 * Expr := Expr "*" Expr
 * Expr := Expr "/" Expr
 */


/**
 * Parses Haskell code
 * \code Code to parse
 * \return The ast
 */
haskell.parser.parse = function(code) {
	var expr = function(state) { return expr(state); };
	
	var operator = function(symbol, lhs, rhs) {
		this.symbol = symbol;
		this.lhs = lhs;
		this.rhs = rhs;
	}
	
	var number = action(repeat1(range('0', '9')), function(ast) { return parseInt(ast.join("")); });
	
	var operator_action = function(p) { return action(p, function(ast) {
		return function(lhs, rhs) {
			return new operator(ast, lhs, rhs);
		};
	})};
	
	var value = choice(number, expr);
	var product = chainl(value, operator_action(choice('*', '/')));
	var sum = chainl(product, operator_action(choice('+', '-')));
	var expr = sum;

	return expr(ps(code));
};