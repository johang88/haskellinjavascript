// The parser

/* 
Todo:
  - Pattern matching
  - List comp.
*/



/**
 * Parses Haskell code
 * \code Code to parse
 * \return The ast
 */
haskell.parser.parse = function(code) {

    var integer = action(repeat1(range('0', '9')), function(ast) { return new haskell.ast.Num(parseInt(ast.join(""))); });

    var ident = action(repeat1(range('a', 'z')), function(ast) { return ast.join(""); });
    
    var literal = ws(integer);
    
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
    
    var varop = undefined;haskell.ast.Num
    
    var qcon = epsilon_p;
    
    var con = choice(conid, sequence(ws('('), consym, ws(')')));
    
    var qvar = choice(qvarid, sequence(ws('('), qvarsym, ws(')')));
    
    var var_ = choice(varid, sequence(ws('('), varsym, ws(')')));
    
    var gcon = undefined;
    
    var fpat = undefined;
    
    var apat = epsilon_p;
    
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
    
    var aexp_action = function(p) {
        return action(p, function(ast) {
            return new haskell.ast.ConstantExpression(ast);
        });
    };
    
    var exp = function(state) { return exp(state); };
    var aexp = aexp_action(choice(  ws(qvar),
                        //ws(qcon),
                        ws(literal),
                        sequence(expect(ws('(')), ws(exp), expect(ws(')'))), // parans
                        sequence(ws('('), ws(exp), ws(','), ws(exp), repeat0(sequence(ws(','), ws(exp))) , ws(')')), // tuple
                        sequence(expect(ws('[')), list(ws(exp), ws(',')) , expect(ws(']')))  // list constructor
                        // todo: more stuff
                      ));
    
    var fexp = action(repeat1(ws(aexp)), function(ast) {
                   if (ast.length == 1) {
                       return ast;
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
    
    var exp_10 = choice(sequence(ws('\\'), repeat1(ws(apat)), ws("->"), ws(exp)),
                        sequence(ws("let"), ws(decls), ws("in"), ws(exp)),
                        sequence(ws("if"), ws(exp), ws("then"), ws(exp), ws("else"), ws(exp)),
                        sequence(ws("case"), ws(exp), ws("of"), ws("{"), ws(alts), ws("}")),
                        sequence(ws("do"), ws("{"), ws(stmts), ws("}")),
                        ws(fexp)
                        );
    
    var op_action = function(p) { return action(p, function(ast) {
            return function(lhs, rhs) {
                var fun1 = new haskell.ast.Application(ast, lhs);
                return new haskell.ast.Application(fun1, rhs);
            };
    })};

    var exp_2 = chainl(fexp, op_action(choice(ws('*'), ws('/'))));
    var exp_1 = chainl(exp_2, op_action(choice(ws('+'), ws('-'))));
    
    var exp_0 = exp_1; // todo: exp operator precedence, hardcode common operators for now?
    
    var exp = choice(   sequence(ws(exp_0), ws("::"), optional(ws(context), ws("=>")), ws(type)),
                        ws(exp_0)
                    );
    
    var gd = undefined;
    
    var gdrhs = undefined;
    
    // todo: missing second choice
    var rhs = sequence(ws('='), ws(exp), optional(sequence(ws("where"), ws(decls))));
    
    // todo: Should be quite a lot of choices here, but those are for 
    //       operators so it's not very important right now
    var funlhs = sequence(repeat1(ws(var_)), repeat0(ws(apat)));
    
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
            var patterns = ast[0][0];
            var fun_ident = patterns[0];
            patterns.shift();
            
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
    
    var test = fexp;
    
    return module(ps(code));
};
