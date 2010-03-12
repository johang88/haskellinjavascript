(function(ast, interpreter) {
    function expectType(o,t) {
	if (! o instanceof t) {
	    throw "Expected " + t + " " + typeof o + " given.";
	};
    };

   /*
      data Module = Module [Declaration]
    */
    ast.Module = function(declarations) {
	this.declarations = declarations;
    };
	
    /*
      data Expression = Constant Value
                      | Lambda Pattern Expression
                      | Application Expression Expression
        	      | Let Pattern Expression Expression
        	      | Case Expression [(Pattern, Expression)]
                      | VariableLookup Identifier
        	      | PrimitiveExpr Function
    */
    ast.Constant = function(value) {
	expectType(value, ast.Value);
	this.type ="Constant";
	this.value = value;
	this.eval = function(env) {
	    return new interpreter.ConstantThunk(this.value);
	};
    };
    ast.Lambda = function(pattern, expression) {
	this.type = "Lambda";
	this.pattern = pattern;
	this.expression = expression;

	this.eval = function(env) {
	    return new interpreter.Closure(env, this);
	};
    };
    ast.Application = function(func, arg) {
	this.type = "Application";
	this.func = func;
	this.arg = arg;
	this.eval = function(env) {
	    clos = this.func.eval(env);
	    x = clos.expression.pattern;
	    body = clos.expression.expression;
	    return body.eval(clos.env.substitute(x, new interpreter.Closure(env, this.arg)));
	};
    };
    ast.Let = function(pattern, def, expr) {
	this.type = "Let";
	this.pattern = pattern;
	this.def = def;
	this.expr = expr;
	this.eval = function(env) {
	    return this.expr.eval(env.substitute(this.pattern, new Closure(env, this.def)));
	};
    };
    ast.Case = function(expr, cases) {
	this.type = "Case";
	this.expr = expr;
	this.cases = cases;
	this.eval = function(env) {
	    expr = new interpreter.Closure(env, this.expr);
	    for (i in this.cases) {
		newEnv = env.derive();
		if (this.cases[i][0].match(newEnv, expr)) {
		    return new interpreter.Closure(this.cases[i][1], newEnv);
		};
	    };
	};
	alert("No matching clause");
    };
    ast.VariableLookup = function(identifier) {
	this.type = "VariableLookup";
	this.identifier = identifier;
	this.eval = function(env) {
	    return env.lookup(this.identifier);
	};
    };
    ast.Primitive = function(func) {
	this.type="Primitive";
	this.func = func;
	this.eval = function(env) {
	    return this.func(env);
	};
    };

    /*
      data Value = Num Int
    */
    ast.Value = function(){};

    ast.Num = function(num) {
	this.type = "Num";
	this.num = num;
    };
    ast.Num.prototype = new ast.Value();

    /*
      data Declaration = Variable Pattern Expression
    */
    ast.Variable = function(pattern, expression) {
	this.type = "Variable";
	this.pattern = pattern;
	this.expression = expression;
    };

    /*
      Pattern = Constructor Identifier [Pattern]
              | VariableBinding Identifier
	      | Combined Identifier Pattern
	      | Constant Value
    */
    ast.Constructor = function(identifier, patterns) {
	this.type = "Constructor";
	this.identifier = identifier;
	this.patterns = patterns;
	this.match = function(env, expr) {
	    while(expr.type!="Data") {
		expr=expr.force();
	    };
	    if (this.identifier!=expr.identifier) {
		return false;
	    };
	    for (i in this.patterns) {
		if (!this.patterns[i].match(env, expr.thunks[i])) {
		    return false;
		};
	    };
	    return true;
	};

	this.vars = function() {
	    vars=[];
	    for (i in this.patterns) {
		vars=vars.concat(this.patterns[i].vars());
	    };
	};
    };
    ast.VariableBinding = function(identifier) {
	this.type = "VariableBinding";
	this.identifier = identifier;
	this.match = function(env, expr) {
	    env.bind(this.identifier, expr);
	    return true;
	};
	this.vars = function() {
	    return [this.identifier];
	};
    };
    ast.Combined = function(identifier, pattern) {
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
    };
    ast.ConstantPattern = function(value) {
	this.type = "ConstantPattern";
	this.value = value;
	this.match = function(env, expr) {
	    while(expr.type!="Constant") {
		expr = expr.force();
	    };
	    return (this.value==expr.value);
	};
	this.vars = function() {
	    return [];
	};
    };

})(haskell.ast,haskell.interpreter);
