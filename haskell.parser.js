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

haskell.parser.parse2 = function(code) {
    var ident = action(repeat1(range('a', 'z')), function(ast) { return ast.join(""); });
    
    var modid = action(sequence(range('A', 'Z'), ident), function(ast) { return ast.join(""); });
    
    var varid = ident;
    var varsym = ident;
    
    var qvarid = ident;
    var qvarsym = ident;
    
    var qtycon = action(sequence(range('A', 'Z'), ident), function(ast) { return ast.join(""); });
    
    var qtycls = ident;
    
    var conid = ident;
    var consym = ident;

    var tycon = qtycon;
    var tyvar = ident;
    
    var tycls = epsilon_p;	
    var gconsym = undefined;
    
    var qop = undefined;
    
    var op = undefined;
    
    var qconop = undefined;
    
    var conop = undefined;
    
    var qvarop = undefined;
    
    var varop = undefined;
    
    var qcon = undefined;
    
    var con = choice(conid, sequence(ws('('), consym, ws(')')));
    
    var qvar = choice(qvarid, sequence(ws('('), qvarsym, ws(')')));
    
    var var_ = choice(varid, sequence(ws('('), varsym, ws(')')));
    
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
    
    var deriving = epsilon_p;
    
    var fielddecl = undefined;
    
    var newconstr = epsilon_p;
    
    var constr = undefined;
    
    var constrs = epsilon_p;
    
    var simpletype = sequence(ws(tycon), optional(ws(list(tyvar, ' '))));
    
    var simpleclass = undefined;
    
    var scontext = undefined;
    
    var class_ = undefined;
    
    var context = undefined;
    
    var gtycon = choice(qtycon,
                        "()",
                        "[]",
                        "(->)",
                        sequence(ws('('), repeat1(ws(',')), ws(')'))
                        );
    
    var type = function(state) { return type(state); };
    var atype = choice( gtycon,
                        tyvar,
                        sequence(ws('('), list(ws(type), ','), ws(')')),
                        sequence(ws('['), ws(type), ws(']')),
                        sequence(ws('('), ws(type), ws(')'))
                        );
    
    var btype = repeat1(ws(atype));
    var type = list(ws(btype), ws("->"));
    
    var fixity = undefined;
    
    var vars = undefined;
    
    var ops = undefined;
    
    var gendecl = undefined;
    
    var idecl = undefined;
    
    var idecls = epsilon_p;
    
    var cdecl = undefined;
    
    var cdecls = epsilon_p;
    
    var decl = undefined;
    
    var decls = undefined;
    
    var topdecl = choice(   sequence(ws("type"), ws(simpletype), ws('='), ws(type)),
                            sequence(ws("data"), optional(sequence(context, "=>")), ws(simpletype), ws('='), constrs, optional(deriving)),
                            sequence(ws("newtype"), optional(sequence(context, "=>")), ws(simpletype), ws('='), newconstr, optional(deriving)),
                            sequence(ws("class"), optional(sequence(scontext, "=>")), tycls, tyvar, optional(sequence(ws("where"), cdecls))),
                            sequence(ws("instance"), optional(sequence(scontext, "=>")), qtycls, inst, optional(sequence(ws("where"), idecls))),
                            sequence(ws("default"), ws('('), list(type, ','), ws(')'))
                        );
    
    var topdecls = list(topdecl, ';');
    
    var cname = choice(var_, con);
    
    var import_ = choice(   var_,
                            sequence(tycon, optional(choice(sequence(ws('('), ws(".."), ws(')')),
                                                        sequence(ws('('), list(cname, ','), ws(')'))))),
                            sequence(tycls, optional(choice(sequence(ws('('), ws(".."), ws(')')),
                                                        sequence(ws('('), list(var_, ','), ws(')')))))
                        );
    
    var impspec = choice(   sequence(ws('('), list(ws(import_), ws(',')), ws(')')),
                            sequence(ws("hiding"), ws('('), list(ws(import_), ws(',')), ws(')'))
                        );
    var impdecl = choice(sequence(ws("import"), optional(ws("qualified")), ws(modid), optional(sequence(ws("as"), ws(modid))), optional(ws(impspec))),
                        '');

    var export_ = choice(   qvar,
                            sequence(qtycon, optional(choice(sequence(ws('('), ws(".."), ws(')')),
                                                        sequence(ws('('), list(cname, ','), ws(')'))))),
                            sequence(qtycls, optional(choice(sequence(ws('('), ws(".."), ws(')')),
                                                        sequence(ws('('), list(qvar, ','), ws(')'))))),
                            sequence(ws("module"), modid)
                        );

    var exports = sequence(ws('('), list(ws(export_), ws(',')), ws(')'));

    var impdecls = list(ws(impdecl), ws(';'));

    var body = choice(  sequence(ws('{'), impdecls, ws(';'), topdecls, optional(ws(';')), ws('}')),
                        sequence(ws('{'), impdecls, optional(ws(';')), ws('}')),
                        sequence(ws('{'), topdecls, optional(ws(';')), ws('}'))
                    );

    var module = choice(sequence(ws("module"), ws(modid), optional(exports), ws("where"), body),
                        body);
    
    return module(ps(code));
};
