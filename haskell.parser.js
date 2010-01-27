// The parser

/**
 **** Lambda Calculus Language Grammar ****
 * Program := [Func]
 * 
 * Func := "\\" [Ident] "->" Expr
 *
 * Expr := Ident
 * Expr := Ident([Expr])
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
	var fun_decl = function(state) { return fun_decl(state); };
	
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
	
	var fun_call_action = function(p) {
		return action(p, function(ast) {
			var a = {};
			a.fun_name = ast[0];
			a.arguments = ast[1];
			return a;
		});
	}
	
	var fun_call = sequence(ident, expect('('), list(expr, ','), expect(')'));
	
	var value = choice( fun_call, 
						choice(ident, number), 
						value_action(sequence(expect('('), fun_decl, expect(')'))));
	var product = chainl(value, operator_action(choice('*', '/')));
	var sum = chainl(product, operator_action(choice('+', '-')));
	var expr = sum;
	var fun_decl = fun_action(sequence(expect('\\'), list(ident, ' '), expect("->"), expr));
	
	if (isExpr != undefined && isExpr) {
		return expr(ps(code));
	} else {
		return fun_decl(ps(code));
	}
};