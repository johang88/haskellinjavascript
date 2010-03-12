// The parser

/* 
Todo:
  - Pattern matching
  - List comp.
  - User defined operators
*/

haskell.parser.lastInternalName = 0;

haskell.parser.generateInternalName = function() {
    var parser = haskell.parser;
    
    var name = "__v" + parser.lastInternalName.toString();
    parser.lastInternalName++;
    return name;
};

haskell.parser.fixity = {};
haskell.parser.fixity.left = 0;
haskell.parser.fixity.right = 1;
haskell.parser.fixity.none = 2;

haskell.parser.Operator = function(prec, fixity) {
    this.prec = prec;
    this.fixity = fixity;
};

haskell.parser.opTable = {};

/**
 * Parses Haskell code
 *
 * Reserved variables in the form __name
 *
 * \code Code to parse
 * \return The ast
 */
haskell.parser.parse = function(code) {

    var integer = action(repeat1(range('0', '9')), function(ast) { return new haskell.ast.Num(parseInt(ast.join(""))); });

    var ident_ = action(repeat0(choice(range('a', 'z'), range('0', '1'), '\'')), function(ast) { return ast.join(""); });
    var ident = action(sequence(range('a', 'z'), ident_), function(ast) { return ast.join(""); });
    
    var literal = ws(integer);
    
    var symbol = choice('!', '#', '$', '%', '&', '*', '+', '.', '/', '<', '=', '>', '?', '@', '\\', '^', '|', '-', '~');
    
    var modid = action(sequence(range('A', 'Z'), ident_), function(ast) { return ast.join(""); });
    
    var varid = ident;
    var varsym = ident;
    
    var qvarid = ident;
    var qvarsym = ident;
    
    var qtycon = action(sequence(range('A', 'Z'), ident_), function(ast) { return ast.join(""); });
    
    var qtycls = ident;
    
    var conid = action(sequence(range('A', 'Z'), ident_), function(ast) { return ast.join(""); });
    var consym = action(repeat1(symbol), function(ast) { return ast.join(""); }); // should not allow reserved symbols
    
    var qconsym = consym;
    var qconid = conid;

    var tycon = qtycon;
    var tyvar = ident;
    
    var tycls = epsilon_p;	
    var gconsym = choice(':', qconsym);
    
    var qconop = choice(gconsym, sequence(expect(ws('`')), qconid, expect(ws('`'))));
    
    var qvarop = choice(qvarsym, sequence(expect(ws('`')), qvarid, expect(ws('`'))));
    
    var qop = choice(qvarop, qconop);
    
    var op = undefined;
    
    var conop = choice(consym, sequence(expect(ws('`')), conid, expect(ws('`'))));
    
    var varop = undefined;
    
    var qcon = choice(qconid, sequence(expect(ws('(')), gconsym, expect(ws(')'))));
    
    var con = choice(conid, sequence(ws('('), consym, ws(')')));
    
    var qvar = choice(qvarid, sequence(ws('('), qvarsym, ws(')')));
    
    var var_ = choice(varid, sequence(ws('('), varsym, ws(')')));
    
    var gcon = choice(  ws("()"),
                        ws("[]"),
                        sequence(ws('('), repeat1(ws(',')), ws(')')),
                        ws(qcon)
                     );
    
    var fpat = undefined;
    
    var list_action = function(p) {
        return action(p, function(ast) {
            // 0,1,2
            // 0 : 1 : 2 : []
            // ((: 0) 1)
            
            ast = ast[0];
            
            var cons = new haskell.ast.VariableLookup(":");
            var empty = new haskell.ast.VariableLookup("[]");
            
            if (ast.length == 0 || ast == false) {
                return empty;
            }
            
            var fun = empty;
            for (var i = ast.length - 1; i >= 0; i--) {
            	var f = new haskell.ast.Application(cons, ast[i]);
            	fun = new haskell.ast.Application(f, fun);
            }
            
            return fun;
        });
    }
    
    var list_pattern_action = function(p) {
        return action(p, function(ast) {
            ast = ast[0];
            
            var cons = "(:)";
            var empty = "[]";
            
            if (ast.length == 0 || ast == false) {
                return new haskell.ast.PatternConstructor(empty);
            }
            
            var fun = empty;
            for (var i = ast.length - 1; i >= 0; i--) {
                var f = new haskell.ast.PatternConstructor(cons, ast[i]);
                fun = new haskell.ast.PatternConstructor(f, fun);
            }
            
            return fun;
        });
    }
    
    var ident_pattern_action = function(p) {
        return action(p, function(ast) {
            return new haskell.ast.VariableBinding(ast);
        });
    }
    
    var constant_pattern_action = function(p) {
        return action(p, function(ast) {
            return new haskell.ast.PatternConstant(ast);
        });
    }
    
    var combined_pattern_action = function(p) {
        return action(p, function(ast) {
            return new haskell.ast.PatternCombined(ast[0], ast[1]);
        });
    }
    
    var wildcard_pattern_action = function(p) {
        return action(p, function(ast) {
            return new haskell.ast.PatternIgnored();
        });
    }
    
    var cons_pattern_action = function(ast) {
        return function(lhs, rhs) {
            // lhs : rhs
            var cons = ':';
            return new haskell.ast.PatternConstructor(cons, [lhs, rhs]);
        };
    }
    
    // todo: implement rpat, lpat and pat
    // should make cons (:) work as expected, that is without parans
    var apat = function(state) { return apat(state) };
    var apat = choice(  combined_pattern_action(sequence(var_, expect(ws('@')), ws(apat))),
                        constant_pattern_action(ws(literal)),
                        ident_pattern_action(ws(ident)),
                        wildcard_pattern_action (ws('_')), // wildcard
                        sequence(expect(ws('(')), apat, expect(ws(')'))), // parans
                        sequence(expect(ws('(')), ws(apat), repeat1(sequence(ws(','), ws(apat))), expect(ws(')'))), // tuple
                        list_pattern_action(sequence(expect(ws('[')), optional(wlist(apat, ',')), expect(ws(']')))), // list
                        sequence(expect(ws('(')), chainl(ws(apat), action(ws(':'), cons_pattern_action)), expect(ws(')')))
                        );
    
    var rpat = undefined;
    
    var lpat = undefined;
    
    var pat = epsilon_p;
    
    var fbind = undefined;
    
    var stmt = undefined;
    
    var stmts = epsilon_p;
    
    var gdpat = undefined;
    
    var alt = undefined;
    
    var alts = epsilon_p;
    
    var qval = undefined;
    
    var exp = function(state) { return exp(state); };
    var infixexp = function(state) { return infixexp(state); };
    
    var right_section_action = function(p) {
        return action(p, function(ast) {
            // (+ x)
            // \y -> y + x
            
            var arg_name = haskell.parser.generateInternalName();
            var op_name = ast[0];
            
            var fun_exp = new haskell.ast.Application(new haskell.ast.VariableLookup(op_name), new haskell.ast.VariableLookup(arg_name));
            fun_exp = new haskell.ast.Application(fun_exp, ast[1]);
            
            var arg = new haskell.ast.VariableBinding(arg_name);
            var fun = new haskell.ast.Lambda(arg, fun_exp);
            
            return fun;
        });
    };
    
    var left_section_action = function(p) {
        return action(p, function(ast) {
            // (x +)
            // \y -> x + y
            
            var arg_name = haskell.parser.generateInternalName();
            var op_name = ast[1];
            
            var fun_exp = new haskell.ast.Application(new haskell.ast.VariableLookup(op_name), ast[0]);
            fun_exp = new haskell.ast.Application(fun_exp, new haskell.ast.VariableLookup(arg_name));
            
            var arg = new haskell.ast.VariableBinding(arg_name);
            var fun = new haskell.ast.Lambda(arg, fun_exp);
            
            return fun;
        });
    };
    
    var qvar_exp_action = function(p) {
        return action(p, function(ast) {
			return new haskell.ast.VariableLookup(ast);
        });
    };
    
    var aexp_constant_action = function(p) {
        return action(p, function(ast) {
            return new haskell.ast.Constant(ast);
        });
    };
    
    var aexp = choice(  qvar_exp_action(ws(qvar)),
                        qvar_exp_action(ws(gcon)),
                        aexp_constant_action(ws(literal)),
                        action(sequence(expect(ws('(')), ws(exp), expect(ws(')'))), function(ast) { return ast[0]; }), // parans
                        sequence(ws('('), ws(exp), ws(','), ws(exp), repeat0(sequence(ws(','), ws(exp))) , ws(')')), // tuple
                        aexp_constant_action(list_action(sequence(expect(ws('[')), optional(wlist(exp, ',')), expect(ws(']'))))),  // list constructor
                        left_section_action(sequence(expect(ws('(')), ws(infixexp), ws(qop), expect(ws(')')))), // left section
                        right_section_action(sequence(expect(ws('(')), ws(qop), ws(infixexp), expect(ws(')')))) // right section, todo: look into resolution of infixexp in this case, see Haskell Report Chapter 3
                        // Todo:
                        //  Arithmetic sequence
                        //  List comprehension
                        //  Labeled construction
                        //  Labeled update
                      );
    
    var fexp = action(repeat1(ws(aexp)), function(ast) {
                   if (ast.length == 1) {
                       return ast[0];
                   } else {
                       // f x y -> (f x) y
                       var f = new haskell.ast.Application(ast[0], ast[1]);
                       for (var i = 2; i < ast.length; i ++) {
                           f = new haskell.ast.Application(f, ast[i]);
                       }
                       return f;
                   }
               });
    
    var rexp = undefined;
    
    var lexp = undefined;
    
    var lambda_exp_action = function(p) {
        return action(p, function(ast) {
            // \x y -> exp
            // \x -> \y -> exp
            
            var fun = ast[1];
            var patterns = ast[0];
            
            for (var i = patterns.length - 1; i >= 0; i--) {
                var arg = new haskell.ast.VariableBinding(patterns[i]);
                fun = new haskell.ast.Lambda(arg, fun);
            }
            
            return fun;
        });
    };
    
    var exp_10 = choice(lambda_exp_action (sequence(expect(ws('\\')), repeat1(ws(apat)), expect(ws("->")), ws(exp))),
                        sequence(ws("let"), ws(decls), ws("in"), ws(exp)),
                        sequence(ws("if"), ws(exp), ws("then"), ws(exp), ws("else"), ws(exp)),
                        sequence(ws("case"), ws(exp), ws("of"), ws("{"), ws(alts), ws("}")),
                        sequence(ws("do"), ws("{"), ws(stmts), ws("}")),
                        ws(fexp)
                        );
    
    var op_action = function(p) { return action(p, function(ast) {
            return function(lhs, rhs) {
                var fun1 = new haskell.ast.Application(new haskell.ast.VariableLookup(ast), lhs);
                return new haskell.ast.Application(fun1, rhs);
            };
    })};
    
    var infixexp_action = function(p) {
        return action(p, function(ast) {
        	if (ast[2] instanceof Array) {
        	    var inner = ast[2];
        	    ast.pop();
        	
        	    for (i in inner) {
        	        if (!inner[i].need_resolve)
        	            ast.push(inner[i]);
        	    }
        	    
        	    ast.info = new function() { 
        	        this.need_resolve = true;
        	    };
        	}
        	
        	return ast;
        });
    };
    
    var infixexp = choice( infixexp_action(sequence(ws(exp_10), ws(qop), ws(infixexp))),
                           sequence(ws('-'), ws(infixexp)),
                           ws(exp_10)
                         );
    
    var resolve_op = function(ast) {
        // todo: lookup all op's before calling parse
        
        var OpApp = function(e1, op, e2) {
            this.e1 = e1;
            this.op = op;
            this.e2 = e2;
        };
        
        var parseNeg = function(op1, rest) { return parseNeg(op1, rest); };
        var parse = function(op1, e1, rest) { return parse(op1, e1, rest); };
        
        var parse = function(op1, e1, rest) {
            if (rest.length == 0) {
                return { exp: e1, rest: null };
            }
            
            var op2 = rest.shift();
            
            if (op1.prec == op2.prec && (op.fixity != op2.fixity || op1.fixity == haskell.parser.fixity.none)) {
                alert("invalid operator precedence stuff!");
                return null;
            }
            
            if (op1.prec > op2.prec || (op1.prec == op2.prec && op1.prec == haskell.parser.fixity.left)) {
                rest.unshift(e1);
                return { exp: e1, rest: rest };
            }
            
            var res = parseNeg(op2, rest);
            return parse(op1, new OpApp(e1, op2, res.exp), res.rest);
        };
        
        var parseNeg = function(op1, rest) {
            var e1 = rest.shift();
            
            if (e1 == '-') {
                // todo
            } else {
                return parse(op1, e1, rest);
            }
        };
        
        return ast;
    };
    
    var exp_action = function(p) {
        return action(p, function(ast) {
            if (ast.info != undefined && ast.info.need_resolve) {
                return resolve_op(ast);
            } else {
                return ast;
            }
        });
    };
    
    var exp = choice(sequence(ws(infixexp), ws("::"), optional(ws(context), ws("=>")), ws(type)),
                        exp_action(ws(infixexp)));
    
    var gd = undefined;
    
    var gdrhs = undefined;
    
    // todo: missing second choice
    var rhs = sequence(ws('='), ws(exp), optional(sequence(ws("where"), ws(decls))));
    
    // todo: Should be quite a lot of choices here, but those are for 
    //       operators so it's not very important right now
    var funlhs = sequence(ws(var_), repeat0(ws(apat)));
    
    var inst = undefined;
    
    var dclass = undefined;
    
    var deriving = epsilon_p;
    
    var fielddecl = undefined;
    
    var newconstr = epsilon_p;
    
    var constr = choice(sequence(ws(con), repeat0(sequence(optional(ws('!')), ws(atype)))),
                        sequence(choice(ws(btype), sequence(optional(ws('!')), ws(atype))), ws(conop), choice(ws(btype), sequence(optional(ws('!')), ws(atype))))
                       ); // Todo: fielddecl stuffz
    
    var constrs = list(ws(constr), ws('|'));
    
    var simpletype = sequence(ws(tycon), optional(ws(list(tyvar, ' '))));
    
    var simpleclass = undefined;
    
    var scontext = undefined;

    var gtycon = choice(qtycon,
                   sequence(repeat1(ws(var_)), repeat0(ws(apat))),
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
    
    var fixity = epsilon_p;
    
    var vars = list(ws(var_), ws(','));
    
    var ops = epsilon_p;
    
    var class_ = choice(sequence(ws(qtycls), ws(tyvar)),
                        sequence(ws(qtycls), ws('('), list(ws(atype), ws(',')) ,ws(')'))
                        );
    
    var context = choice(   ws(class_), 
                            sequence(ws('('), list(ws(class_), ws(',')) ,ws(')'))
                        );
    
    var gendecl = choice(   sequence(ws(vars), ws("::"), optional(sequence(ws(context), ws("=>"))), ws(type)),
                            sequence(ws(fixity), optional(ws(integer)), ws(ops)),
                            epsilon_p
                        );
    
    var idecl = undefined;
    
    var idecls = epsilon_p;
    
    var cdecl = undefined;
    
    var cdecls = epsilon_p;
    
    var fun_action = function(p) {
        return action(p, function(ast) {
            var patterns = ast[0][1];
            var fun_ident = ast[0][0];

            return new haskell.ast.FunDef(fun_ident, patterns, ast[1][1], null);
        });
    };
    
    // This choice sequence differs from the haskell specification
    // gendecl and funlhs had to be swapped in order for it to parse
    // but I have not been able to seen any side effects from this
    var decl = choice(  fun_action(sequence(ws(choice(funlhs, pat)), ws(rhs))),
                        gendecl
                     );
    
    var decls = list(ws(decl), ws(';'));
    
    var topdecl = choice(   sequence(ws("type"), ws(simpletype), ws('='), ws(type)),
                            sequence(ws("data"), optional(sequence(context, "=>")), ws(simpletype), ws('='), constrs, optional(deriving)),
                            sequence(ws("newtype"), optional(sequence(context, "=>")), ws(simpletype), ws('='), newconstr, optional(deriving)),
                            sequence(ws("class"), optional(sequence(scontext, "=>")), tycls, tyvar, optional(sequence(ws("where"), cdecls))),
                            sequence(ws("instance"), optional(sequence(scontext, "=>")), qtycls, inst, optional(sequence(ws("where"), idecls))),
                            sequence(ws("default"), ws('('), list(type, ','), ws(')')),
                            ws(decl)
                        );
    
    var topdecls_action = function(p) {
        return action(p, function(ast) {
            return ast.filter(function(element) {
                return element instanceof haskell.ast.FunDef;
            });
        });
    };
    var topdecls = topdecls_action(list(ws(topdecl), ws(';')));
    
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

    
    var body_action = function(p) {
        return action(p, function(ast) {
            return ast[1];
        });
    };    

    var body = choice(  sequence(ws('{'), impdecls, ws(';'), topdecls, optional(ws(';')), ws('}')),
                        sequence(ws('{'), impdecls, optional(ws(';')), ws('}')),
                        body_action(sequence(ws('{'), topdecls, optional(ws(';')), ws('}')))
                    );

    var module_action = function(p) {
        return action(p, function(ast) {
            var declarations = null;
            
            if (ast instanceof Array) {
                return new haskell.ast.Module(ast[4]);
            } else {
                return new haskell.ast.Module(ast);
            }
        });
    }

    var module = module_action(choice(sequence(ws("module"), ws(modid), optional(exports), ws("where"), body),
                        body));
    
    var test = sequence(ws(literal), optional(ws(literal)));
    
    return choice(module, exp)(ps(code));
};
