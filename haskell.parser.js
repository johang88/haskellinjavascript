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
	
	// AST Build functions
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
	
	// Grammar
	var fun_call = sequence(ident, expect('('), list(expr, ','), expect(')'));
	
	var value = choice( fun_call_action(fun_call), 
						choice(ident, number), 
						value_action(sequence(expect('('), fun_decl, expect(')'))));
	var product = chainl(value, operator_action(choice('*', '/')));
	var sum = chainl(product, operator_action(choice('+', '-')));
	var expr = sum;
	var fun_decl = choice( expr, 
						   fun_action(sequence(expect('\\'), list(ident, ' '), expect("->"), expr)));
	
	if (isExpr != undefined && isExpr) {
		return expr(ps(code));
	} else {
		return fun_decl(ps(code));
	}
};

haskel.parser.parse2 = function(code) {
    var gconsym = undefined;
    
    var qop = undefined;
    
    var op = undefined;
    
    var qconop = undefined;
    
    var conop = undefined;
    
    var qvarop = undefined;
    
    var varop = undefined;
    
    var qcon = undefined;
    
    var con = undefined;
    
    var qvar = undefined;
    
    var var_ = undefined;
    
    var gcon = undefined;
    
    var fpat = undefined;
    
    var apat = undefined;
    
    var rpat = undefined;
    
    var lpat = undefined;
    
    var pat = undefined;
    
    var fbind = undefined;
    
    var stmt = undefined;
    
    var stmts = undefined;
    
    var gdpat = undefined;
    
    var alt = undefined;
    
    var alts = undefined;
    
    var qval = undefined;
    
    var aexp = undefined;
    
    var fexp = undefined;
    
    var rexp = undefined;
    
    var lexp = undefined;
    
    var exp = undefined;
    
    var gd = undefined;
    
    var gdrhs = undefined;
    
    var rhs = undefined;
    
    var funlhs = undefined;
    
    var inst = undefined;
    
    var dclass = undefined;
    
    var deriving = undefined;
    
    var fielddecl = undefined;
    
    var newconstr = undefined;
    
    var constr = undefined;
    
    var constrs = undefined;
    
    var simpletype = undefined;
    
    var simpleclass = undefined;
    
    var scontext = undefined;
    
    var class_ = undefined;
    
    var context = undefined;
    
    var gtycon = undefined;
    
    var atype = undefined;
    
    var btype = undefined;
    
    var type = undefined;
    
    var fixity = undefined;
    
    var vars = undefined;
    
    var ops = undefined;
    
    var gendecl = undefined;
    
    var idecl = undefined;
    
    var idecls = undefined;
    
    var cdecl = undefined;
    
    var cdecls = undefined;
    
    var decl = undefined;
    
    var decls = undefined;
    
    var topdecl = undefined;
    
    var topdecls = undefined;
    
    var cname = undefined;
    
    var import_ = undefined;
    
    var impspec = undefined;
    
    var impcecl = undefined;

    var export_ = undefined;

    var exports = undefined;

    var impdecls = undefined;

    var body = undefined;

    var module = undefined;
};