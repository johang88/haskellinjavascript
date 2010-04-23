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
      data Expression = Constant Value
                      | Lambda Pattern Expression
                      | Application Expression Expression
            	      | Let Pattern Expression Expression
               	      | Case Expression [(Pattern, Expression)]
                      | VariableLookup Identifier
		      | Do [DoNotation]
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
        return this;
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
            return "(" + this.pattern.stringify() + " -> " + this.expression.stringify() + ")";
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
            while (!(continuation instanceof interpreter.LambdaAbstraction)) {
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
	    var newEnv = env.derive();
	    for (var i in this.declr) {
		var declr = this.declr[i];
		newEnv.patternBind(declr.pattern, new interpreter.HeapPtr(new interpreter.Closure(newEnv, declr.expression)));
	    }
	    return this.expr.eval(newEnv);
	};
        this.stringify = function() {
            return "let " + this.declr.stringify() + " in " + this.expr.stringify();
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
		    return this.cases[i][1].eval(newEnv);
		};
	    };
	    alert("No matching clause");
	};

        this.stringify = function() {
            return "case " + this.expr.stringify() + "of {" +
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
    ast.Do = function(notations) {
	expectTypeArray(notations, ast.DoNotation);
	this.notations = notations;
    };
    ast.Do.prototype = new ast.Expression();
    ast.Do.prototype.desugar = function() {
	var rest = this.notations.concat();
	var first = rest.shift();
	return (first.partDesugar(rest));
    };
    ast.Primitive = function(func) {
	expectTypeOf(func, "function");
	this.type="Primitive";
	this.func = func;
	this.eval = function(env) {
	    return this.func(env);
	};

        this.stringify = function() {
            return "{primitive}";
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
	this.declrs = declrs;
    };
    ast.DoLet.prototype = new ast.DoNotation();
    ast.DoLet.prototype.partDesugar = function(rest) {
	// let declr ; do ==> let declr in do
	return new ast.Let(this.declr, new ast.Do(rest));
    };

    ast.DoBind = function(pattern, expression) {
	expectType(pattern, ast.Pattern);
	expectType(expression, ast.Expression);
	this.pattern = pattern;
	this.expression = expression;
    };
    ast.DoBind.prototype = new ast.DoNotation();
    ast.DoBind.prototype.partDesugar = function(rest) {
	// x <- expr ; do ==>  expr >>= (x -> do)
	return new ast.Application(ast.Application(new ast.VariableLookup(">>="), this.expression), ast.Lambda(this.pattern, new ast.Do(rest)));
    };

    ast.DoExpr = function(expr) {
	expectType(expr, ast.Expression);
	this.expr = expr;
    };
    ast.DoExpr.prototype = new ast.DoNotation();
    ast.DoExpr.prototype.partDesugar = function(rest) {
	if (rest.length == 0) {
	    return this.expr;
	};
	// expr ; do ==> expr >> do
	return new ast.Application(ast.Application(new ast.VariableLookup(">>"), this.expression), new ast.Do(rest));
    };

    /*
      data Value = Num Int
    */
    ast.Value = function(){};

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
                       | Data Identifier [Constructor]
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

    ast.Data = function(identifier, constructors) {
	expectTypeOf(identifier, "string");
	expectTypeArray(constructors, ast.Constructor);
	this.type = "Data";
	this.identifier = identifier;
	this.constructors = constructors;
    };

    ast.Variable.prototype = new ast.Declaration();
    ast.Data.prototype = new ast.Declaration();


    /*
      data Constructor = Constructor Identifier Integer
     */
    ast.Constructor = function(identifier, num) {
	expectTypeOf(identifier, "string");
	expectTypeOf(num, "number");
	this.type = "Constructor";
	this.identifier = identifier;
	this.number = num;
    };

    /*
      Pattern = Constructor Identifier [Pattern]
              | VariableBinding Identifier
	      | Combined Identifier Pattern
	      | ConstantPattern Value
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
