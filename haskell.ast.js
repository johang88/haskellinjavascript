(function(ast, interpreter, utilities) {
    expectType = utilities.expectType;

    expectTypeOf = utilities.expectTypeOf;

    expectTypeArray = utilities.expectTypeArray;

   /*
      data Module = Module VisibleNames [Import] [Declaration]
    */
    ast.Module = function(declarations) {
	expectTypeArray(declarations, ast.Declaration);
	this.declarations = declarations;
    };

    /* 
       data VisibleNames = Hiding [NameDef]
                   | Showing [NameDef]
    */

    /* 
       data NameDef = Name Identifier | ConstructorName Identifer [NameDef] | NoName
       // NoName = ...
    */

    /* 
       Import = Import Identifier VisibleNames
              | ImportQualified Identifer VisibleNames Identifier
     */

    /* 
       data Type = TypeVariable Identifier
                 | TypeConstructor Identifier
		 | TypeApplication Type Type
		 | TypeTupple Int
    */

    ast.Type = function() {};

    ast.TypeVariable = function(name) {
	expectTypeOf(name, "string");
	this.name = name;
    };
    ast.TypeVariable.prototype = new ast.Type();
    ast.TypeVariable.prototype.stringify = function() {
        return this.name;
    };

    ast.TypeConstructor = function(name) {
	expectTypeOf(name, "string");
	this.name = name;
    };
    ast.TypeConstructor.prototype = new ast.Type();
    ast.TypeConstructor.prototype.stringify = function() {
        return this.name;
    };

    ast.TypeApplication = function(t1, t2) {
	expectType(t1, ast.Type);
	expectType(t2, ast.Type);
	this.t1 = t1;
	this.t2 = t2;
    };
    ast.TypeApplication.prototype = new ast.Type();
    ast.TypeApplication.prototype.stringify = function() {
        return this.t1.stringify() + " " + this.t2.stringify();
    };

    ast.TypeTupple = function(size) {
	expectTypeOf(size, "number");
	this.size = size;
    };
    ast.TypeTupple.prototype = new ast.Type();
    ast.TypeTupple.prototype.stringify = function() {
        return "(" + (new Array(this.size)).join(",") + ")";
    };

    /* 
       data Constraint = Constraint Identifier Identifier
     */

    ast.Constraint = function(typeclass, typevar) {
        expectTypeOf(typeclass, "string");
        expectTypeOf(typevar, "string");
        this.typeclass = typeclass;
        this.typevar = typevar;
    };
    ast.Constraint.prototype.stringify = function() {
        return this.typeclass + " " + this.typevar;
    };

    /*
      data TypeConstraint = TypeConstraint [Constraint] Type
    */
    ast.TypeConstraint = function(constraints, type) {
        expectTypeArray(constraints, ast.Constraint);
        expectType(type, ast.Type);
        this.constraints = constraints;
        this.type = type;
    };
    ast.Constraint.prototype.stringify = function() {
        var constraints  = this.constraints.map(function(p) { return p.stringify(); }).join(", ");
        if (constraints.length > 0) {
            constraints = "(" + constraints + ") => ";
        }
	return predsString + this.type.stringify();
    };    

	
    /*
      data Expression = Constant Value
                      | Lambda Pattern Expression
                      | Application Expression Expression
            	      | Let Pattern Expression Expression
               	      | Case Expression [(Pattern, Expression)]
                      | VariableLookup Identifier
                      | ExpressionTypeConstraint Expression TypeConstraint
		      | If Expression Expression Expression
		      | Do [DoNotation]
		      | List [Expression]
		      | ArithmeticSequence Expression (Maybe Expression) (Maybe Expression)
		      | ListComprehension Expression [ListNotation]
		      | Primitive Function
    */
    // Eval returns a whnf
    ast.Expression = function(){};
    ast.Expression.prototype = new Object();
    // Either desugar or the other needs overriding in child objects
    ast.Expression.prototype.eval = function(env) {
        return this.desugar().eval(env);
    };
    ast.Expression.prototype.stringify = function() {
        return this.desugar().stringify();
    };
    ast.Expression.prototype.desugar = function() {
        return undefined;
    };

    ast.Constant = function(value) {
	expectType(value, ast.Value);
	this.type ="Constant";
	this.value = value;
    };
    ast.Constant.prototype = new ast.Expression();
    ast.Constant.prototype.eval = function(env) {
	return this.value.eval(env);
    };
    ast.Constant.prototype.stringify = function() {
        return this.value.stringify();
    };

    ast.Lambda = function(pattern, expression) {
	expectType(pattern, ast.Pattern);
	expectType(expression, ast.Expression);
	this.type = "Lambda";
	this.pattern = pattern;
	this.expression = expression;

	this.eval = function(env) {
	    return new interpreter.LambdaAbstraction(env, this.pattern, this.expression);
	};

        this.stringify = function() {
            return "(\\" + this.pattern.stringify() + " -> " + this.expression.stringify() + ")";
        };
    };
    ast.Application = function(func, arg) {
	expectType(func, ast.Expression);
	expectType(arg, ast.Expression);
	this.type = "Application";
	this.func = func;
	this.arg = arg;
	this.eval = function(env) {
            var continuation = this.func.eval(env);
            while (!(continuation instanceof interpreter.WeakHead)) {
                continuation = continuation.force();
            };
            return continuation.apply(new interpreter.HeapPtr(new interpreter.Closure(env, this.arg)));
	};
        this.stringify = function() {
            return "(" + this.func.stringify() + ") (" + this.arg.stringify() + ")";
        };
    };
    ast.Let = function(declr, expr) {
	expectTypeArray(declr, ast.Declaration);
	expectType(expr, ast.Expression);
	this.type = "Let";
	this.declr = declr;
	this.expr = expr;
	this.eval = function(env) {
	    var newEnv = interpreter.loadDeclarations(this.declr, env.derive());
	    return new interpreter.Closure(newEnv, this.expr);
	};
        this.stringify = function() {
            return "let {" + this.declr.map(function (d) {
		    return d.stringify();
		}).join(";") + "} in " + this.expr.stringify();
        };
    };
    ast.Case = function(expr, cases) {
	expectType(expr, ast.Expression);
	// TODO: Expect cases [(Pattern, Expression)]
	this.type = "Case";
	this.expr = expr;
	this.cases = cases;
	this.eval = function(env) {
	    var expr = new interpreter.HeapPtr(new interpreter.Closure(env, this.expr));
	    for (var i in this.cases) {
		var newEnv = env.derive();
		if (this.cases[i][0].match(newEnv, expr)) {
		    return new interpreter.Closure(newEnv, this.cases[i][1]);
		};
	    };
	    throw new Error("No matching clause");
	};

        this.stringify = function() {
            return "case " + this.expr.stringify() + " of {" +
                this.cases.map(function(c) {
                    return c[0].stringify() + " -> " + c[1].stringify() + ";";
                }).join("") + "}";
        };
    };
    ast.VariableLookup = function(identifier) {
	expectTypeOf(identifier, "string");
	this.type = "VariableLookup";
	this.identifier = identifier;
	this.eval = function(env) {
	    return env.lookup(this.identifier).dereference();
	};

        this.stringify = function() {
            return this.identifier;
        };
    };
    ast.ExpressionTypeConstraint = function(expr, type) {
        expectType(expr, ast.Expression);
        expectType(type, ast.TypeConstraint);
        this.expr = expr;
        this.type = type;
        this.eval = function(env) {
            return this.expr.eval(env);
        };
        
        this.stringify = function() {
            return this.expr.stringify() + " :: " + this.type.stringify();
        };
    };
    ast.ExpressionTypeConstraint.prototype = new ast.Expression();

    ast.If = function(ifExpr, thenExpr, elseExpr) {
	expectType(ifExpr, ast.Expression);
	expectType(thenExpr, ast.Expression);
	expectType(elseExpr, ast.Expression);
	this.ifExpr = ifExpr;
	this.thenExpr = thenExpr;
	this.elseExpr = elseExpr;
	this.eval = function(env) {

	};
	
	this.stringify = function() {
	    return "if " + this.ifExpr.stringify() + " then " + this.thenExpr.stringify() + " else " + this.elseExpr.stringify();
	};

	this.eval = function(env) {
	    var expr = new interpreter.HeapPtr(new interpreter.Closure(env, this.ifExpr));
	    var res = expr.dereference();
	    if (new ast.PatternConstructor("True", []).match(env, expr)) {
		return this.thenExpr;
	    } else {
		return this.elseExpr;
	    }
	};
    };
    ast.If.prototype = new ast.Expression();

    ast.Do = function(notations) {
	expectTypeArray(notations, ast.DoNotation);
	this.type="Do";
	this.notations = notations;
    };
    ast.Do.prototype = new ast.Expression();
    ast.Do.prototype.desugar = function() {
	var rest = this.notations.concat();
	var first = rest.shift();
	return (first.partDesugar(rest));
    };

    ast.List = function(expressions) {
	expectTypeArray(expressions, ast.Expression);
	this.type="List";
	this.expressions = expressions;
    };
    ast.List.prototype = new ast.Expression();
    ast.List.prototype.desugar = function() {
	// [] = []
	// [1] = 1:[]
	// [1,2] = 1:[2]
	if (this.expressions.length == 0) {
	    return new ast.VariableLookup("[]");
	};
	var first = this.expressions[0];
	return new ast.Application(new ast.Application(new ast.VariableLookup(":"), 
						       first), 
				   new ast.List(this.expressions.slice(1))
				   );
    };

    ast.ArithmeticSequence = function(e1, e2, e3) {
	expectType(e1, ast.Expression);
	if (e2) expectType(e2, ast.Expression);
	if (e3) expectType(e3, ast.Expression);
	this.type="ArithmeticSequence";
	this.e1 = e1;
	this.e2 = e2;
	this.e3 = e3;
    };
    ast.ArithmeticSequence.prototype = new ast.Expression();
    ast.ArithmeticSequence.prototype.desugar = function() {
	// [e1..]      = enumFrom e1
	// [e1,e2..]   = enumFromThen e1 e2
	// [e1..e3]    = enumFromTo e1 e3
	// [e1,e2..e3] = enumFromThenTo e1 e2 e3
	var funname = 'enumFrom';
	if (this.e2) funname = funname + 'Then';
	if (this.e3) funname = funname + 'To';
	var application = new ast.Application(new ast.VariableLookup(funname), this.e1);
	if (this.e2) application = new ast.Application(application, this.e2);
	if (this.e3) application = new ast.Application(application, this.e3);
	return application;
    };

    ast.ListComprehension = function(ret, notations) {
	expectType(ret, ast.Expression);
	expectTypeArray(notations, ast.ListNotation);
	this.type="ListComprehensions";
	this.ret = ret;
	this.notations = notations;
    };
    ast.ListComprehension.prototype = new ast.Expression();
    ast.ListComprehension.prototype.desugar = function() {
	if (this.notations.length == 0) {
	    return (new ast.Application(new ast.Application(new ast.VariableLookup(":"), this.ret), new ast.VariableLookup("[]")));
	}
	var first = this.notations[0];
        return first.partDesugar(new ast.ListComprehension(this.ret,
						           this.notations.slice(1)));
    };



    ast.Primitive = function(func) {
	expectTypeOf(func, "function");
	this.type="Primitive";
	this.func = func;
	this.eval = function(env) {
	    return this.func(env);
	};

        this.stringify = function() {
            return "{primitive function}";
        };
    };
    ast.Lambda.prototype           = new ast.Expression();
    ast.Application.prototype       = new ast.Expression();
    ast.Let.prototype               = new ast.Expression();
    ast.Case.prototype              = new ast.Expression();
    ast.VariableLookup.prototype    = new ast.Expression();
    ast.Primitive.prototype     = new ast.Expression();
    /*    ast.Constant.prototype.constructor = ast.Constant; 
    ast.Lambda.prototype.constructor = ast.Lambda; 
    ast.Application.prototype.constructor = ast.Application; 
    ast.Let.prototype.constructor = ast.Let; 
    ast.Case.prototype.constructor = ast.Case; 
    ast.VariableLookup.prototype.constructor = ast.VariableLookup; 
    ast.Primitive.prototype.constructor = ast.Primitive; */

    /*
      data DoNotation = DoLet [Declaration]
                      | DoBind Pattern Expression
		      | DoExpr Expression
     */
    ast.DoNotation = function(){};
    
    ast.DoLet = function(declrs) {
	expectTypeArray(declrs, ast.Declaration);
	this.type="DoLet";
	this.declrs = declrs;
    };
    ast.DoLet.prototype = new ast.DoNotation();
    ast.DoLet.prototype.partDesugar = function(rest) {
	// let declr ; do ==> let declr in do
	return new ast.Let(this.declrs, new ast.Do(rest));
    };

    ast.DoBind = function(pattern, expression) {
	expectType(pattern, ast.Pattern);
	expectType(expression, ast.Expression);
	this.type="DoBind";
	this.pattern = pattern;
	this.expression = expression;
    };
    ast.DoBind.prototype = new ast.DoNotation();
    ast.DoBind.prototype.partDesugar = function(rest) {
	// x <- expr ; do ==>  expr >>= (a -> case a of x -> do; _ -> fail undefined)
	return new ast.Application(
				   new ast.Application(
						       new ast.VariableLookup(">>="), 
						       this.expression
						       ),
				   new ast.Lambda(new ast.VariableBinding("__todoGenerateunique"), 
						  new ast.Case(new ast.VariableLookup("__todoGenerateunique"), 
							       [[this.pattern, new ast.Do(rest)], 
								[new ast.Wildcard(),new ast.Application(new ast.VariableLookup("fail"), new ast.VariableLookup("undefined"))]])
						  )
				   );
    };

    ast.DoExpr = function(expr) {
	expectType(expr, ast.Expression);
	this.type="DoExpr";
	this.expr = expr;
    };
    ast.DoExpr.prototype = new ast.DoNotation();
    ast.DoExpr.prototype.partDesugar = function(rest) {
	if (rest.length == 0) {
	    return this.expr;
	};
	// expr ; do ==> expr >> do
	return new ast.Application(new ast.Application(new ast.VariableLookup(">>"), this.expr), new ast.Do(rest));
    };

    /* 
       data ListNotation = ListGuard Expression
                         | ListBind Pattern Expression
			 | ListLet Pattern Expression
     */
    
    ast.ListNotation = function() {};
 
    ast.ListGuard = function(expr) {
	expectType(expr, ast.Expression);
	this.type="ListGuard";
	this.expr = expr;
    };
    ast.ListGuard.prototype = new ast.ListNotation();
    ast.ListGuard.prototype.partDesugar = function(rest) {
        return new ast.Application(new ast.Application(new ast.VariableLookup("concatMap"), 
                                                       new ast.Lambda(new ast.Wildcard(), rest)),
                                   new ast.Application(new ast.VariableLookup("guard"),
						       this.expr));
    };

    ast.ListBind = function(pattern, expr) {
	expectType(pattern, ast.Pattern);
	expectType(expr, ast.Expression);
	this.type="ListBind";
	this.pattern = pattern;
	this.expr = expr;
    };
    ast.ListBind.prototype = new ast.ListNotation();
    ast.ListBind.prototype.partDesugar = function(rest) {
        return new ast.Application(new ast.Application(new ast.VariableLookup("concatMap"), 
                                                       new ast.Lambda(this.pattern, rest)),
				   this.expr);
    };

    ast.ListLet = function(decls) {
	expectType(decls, ast.Declaration);
	this.type="ListLet";
	this.decls = decls
    };
    ast.ListLet.prototype = new ast.ListNotation();
    ast.ListLet.prototype.partDesugar = function() {
	// let p = expr ==> let p = expr ...
	return new ast.DoLet(this.decls);
    };

    

    /*
      data Value = Num Int
    */
    ast.Value = function() {};
    ast.Num = function(num) {
	expectTypeOf(num, "number");
	this.type = "Num";
	this.num = num;

	this.match = function(env, n) {
            return (new ast.PatternConstructor("I#", [new ast.ConstantPattern(new ast.PrimitiveValue(this.num))])).match(env, n);
	};

	this.eval = function(env) {
            return new interpreter.Data("I#", [new interpreter.HeapPtr(new interpreter.Closure(env, new ast.Constant(new ast.PrimitiveValue(this.num))))]);
	};

        this.stringify = function() {
            return this.num;
        };
    };
    ast.PrimitiveValue = function(value) {
	this.type="PrimitiveValue";
	this.value = value;
	this.eval = function(env) {
	    return this.value;
	};
        this.match = function(env, v) {
            return this.value == v.dereference();
        };

        this.stringify = function()
        {
            return this.value + "#";
        };
    };
       
    ast.Num.prototype = new ast.Value();
    ast.PrimitiveValue.prototype = new ast.Value();
    /*
      data Declaration = Variable Pattern Expression
                       | Function Identifier [Pattern] [(Guard, Expression)]|Expression 
                       | Data Identifier [TVar] [Constructor]
                       | TypeConstraintDeclaration [Identifier] TypeConstraint
    */

    ast.Declaration = function(){};

    ast.Variable = function(pattern, expression) {
	expectType(pattern, ast.Pattern);
	expectType(expression, ast.Expression);
	this.type = "Variable";
	this.pattern = pattern;
	this.expression = expression;

        this.stringify = function() {
            return this.pattern.stringify() + " = " + this.expression.stringify();
        };
    };
 
    ast.Data = function(identifier, tvars, constructors) {
	expectTypeOf(identifier, "string");
	expectTypeArray(tvars, ast.TypeVariable);
	expectTypeArray(constructors, ast.Constructor);
	this.type = "Data";
	this.identifier = identifier;
	this.tvars = tvars;
	this.constructors = constructors;
    };

    // expression can either be an expression or a list of [guard, expression]
    // where guard is an expression of type Boolean.
    ast.Function = function(identifier, patterns, expression) {
	expectTypeOf(identifier, "string");
	expectTypeArray(patterns, ast.Pattern);
	// expression can be two different kinds... TODO: fix this?
	this.type = "Function";
	this.identifier = identifier;
	this.patterns = patterns;
	this.expression = expression;
	this.patternMatch = function(env, givenArgs) {
	    for (var i in this.patterns) {
		if (!this.patterns[i].match(env, givenArgs[i])) {
		    return false;
		}
	    };
	    return true;
	};

	this.stringify = function() {
	    var exprstr;
	    if (this.expression instanceof Array) {
		exprstr = this.expression.map(function(e) {
			return e[0].stringify() + " -> " + e[1].stringify();
		    }).join("|");
	    } else {
		exprstr = this.expression.stringify();
	    };
	    return this.identifier + this.patterns.map(function(p) {
		    return p.stringify();
		}).join(" ") + " = " + exprstr;
	};
    };

    ast.TypeConstraintDeclaration = function(funs, type) {
        // expectTypeArrayOf(funs, "string");
        expectType(type, ast.TypeConstraint);
        this.funs = funs;
        this.type = type;
    };
    ast.TypeConstraintDeclaration.prototype = new ast.Declaration();

    ast.Variable.prototype = new ast.Declaration();
    ast.Data.prototype = new ast.Declaration();
    ast.Function.prototype = new ast.Declaration();

    /*
      data Constructor = Constructor Identifier [Type]
     */

    ast.Constructor = function(identifier, types) {
	expectTypeOf(identifier, "string");
	expectTypeArray(types, ast.Type);
	this.type = "Constructor";
	this.identifier = identifier;
	this.types = types;
    };

    /*
      Pattern = Constructor Identifier [Pattern]
              | VariableBinding Identifier
	      | Combined Identifier Pattern
	      | ConstantPattern Value
	      | Wildcard
    */

    ast.Pattern = function(){};

    ast.PatternConstructor = function(identifier, patterns) {
	expectTypeOf(identifier, "string");
	expectTypeArray(patterns, ast.Pattern);
	this.type = "PatternConstructor";
	this.identifier = identifier;
	this.patterns = patterns;
	this.match = function(env, expr) {
            var weakHead = expr.dereference();
	    if (this.identifier!=weakHead.identifier) {
		return false;
	    };
	    for (var i in this.patterns) {
		if (!this.patterns[i].match(env, weakHead.ptrs[i])) {
		    return false;
		};
	    };
	    return true;
	};

	this.vars = function() {
	    var vars=[];
	    for (var i in this.patterns) {
		vars=vars.concat(this.patterns[i].vars());
	    };
	    return vars;
	};

        this.stringify = function() {
            return this.identifier + " " + this.patterns.map(function(p) {
                return p.stringify();
            }).join(" ");
        };
    };
    ast.VariableBinding = function(identifier) {
	expectTypeOf(identifier, "string");
	this.type = "VariableBinding";
	this.identifier = identifier;
	this.match = function(env, expr) {
	    env.bind(this.identifier, expr);
	    return true;
	};
	this.vars = function() {
	    return [this.identifier];
	};

        this.stringify = function() {
            return this.identifier;
        };
    };
    ast.Combined = function(identifier, pattern) {
	expectTypeOf(identifier, "string");
	expectType(pattern, ast.Pattern);
	this.type = "Combined";
	this.identifier = identifier;
	this.pattern = pattern;
	this.match = function(env, expr) {
	    env.bind(this.identifier, expr);
	    return this.pattern.match(env, expr);
	};
	this.vars = function() {
	    return [this.identifier].concat(this.pattern.vars());
	};
        this.stringify = function() {
            return this.identifier + "@(" + this.pattern.stringify() + ")";
        };
    };
    ast.ConstantPattern = function(value) {
	expectType(value, ast.Value);
	this.type = "ConstantPattern";
	this.value = value;
	this.match = function(env, expr) {
	    return (this.value.match(env, expr));
	};
	this.vars = function() {
	    return [];
	};

        this.stringify = function() {
            return this.value.stringify();
        };
    };
    ast.Wildcard = function() {
	this.type = "Wildcard";
	this.match = function(env, expr) {
	    return true;
	};
	this.vars = function() {
	    return [];
	};
        this.stringify = function() {
            return "_";
        };
    };

    ast.PatternConstructor.prototype     = new ast.Pattern();
    ast.VariableBinding.prototype = new ast.Pattern();
    ast.Combined.prototype        = new ast.Pattern();
    ast.ConstantPattern.prototype = new ast.Pattern();
    ast.Wildcard.prototype        = new ast.Pattern();
})(haskell.ast,haskell.interpreter, haskell.utilities);
