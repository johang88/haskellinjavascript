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
haskell.parser.parse = function(code, isExpr) {
	var expr = function(state) { return expr(state); };
	
	var operator = function(symbol, lhs, rhs) {
		this.symbol = symbol;
		this.lhs = lhs;
		this.rhs = rhs;
	}
	
	var number = action(repeat1(range('0', '9')), function(ast) { return parseInt(ast.join("")); });
	var ident = action(repeat1(range('a', 'z')), function(ast) { return ast.join(""); });
	
	var operator_action = function(p) { return action(p, function(ast) {
		return function(lhs, rhs) {
			return new operator(ast, lhs, rhs);
		};
	})};
	
	var value_action = function(p) {
		return action(p, function(ast) {
			if (ast instanceof Array && ast.length == 1) {
				ast = ast[0];
			}
			return ast;
		});
	};
	
	var fun_action = function(p) {
		return action(p, function(ast) {
			var a = {};
			a.arguments = ast[0]
			a.expr = ast[1];
			return a;
		});
	};
	
	var value = choice(choice(ident, number), value_action(sequence(expect('('), fun, expect(')'))));
	var product = chainl(value, operator_action(choice('*', '/')));
	var sum = chainl(product, operator_action(choice('+', '-')));
	var expr = sum;
	var fun = fun_action(sequence(expect('\\'), list(ident, ' '), expect("->"), expr));
	
	if (isExpr != undefined && isExpr) {
		return expr(ps(code));
	} else {
		return fun(ps(code));
	}
};