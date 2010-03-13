(function(ast, interpreter) {
    function expectType(o,t) {
	if (!(o instanceof t)) {
	    throw "Expected " + typeof t + " " + typeof o + " given.";
	};
    };

    function expectTypeOf(o, t) {
	if ((typeof o) != t) {
	    throw "Expected " + t + " " + typeof o + " given.";
	};
    };

    function expectTypeArray(os, t) {
	for (i in os) {
	    if (!(os[i] instanceof t)) {
		throw "Expected " + typeof t + " " + typeof o[i] + " at index " + i;
	    };
	};
    };

   /*
      data Module = Module [Declaration]
    */
    ast.Module = function(declarations) {
	expectTypeArray(declarations, ast.Declaration);
	this.declarations = declarations;
    };
	
    /*
      data Expression = Constant Value
                      | Lambda Pattern Expression
                      | Application Expression Expression
            	      | Let Pattern Expression Expression
               	      | Case Expression [(Pattern, Expression)]
                      | VariableLookup Identifier
        	          | Primitive Function
    */
    
    ast.Expression = function(){};



    ast.Constant = function(value) {
	expectType(value, ast.Value);
	this.type ="Constant";
	this.value = value;
	this.eval = function(env) {
	    return new interpreter.ConstantThunk(this.value);
	};
    };
    ast.Lambda = function(pattern, expression) {
	expectType(pattern, ast.Pattern);
	expectType(expression, ast.Expression);
	this.type = "Lambda";
	this.pattern = pattern;
	this.expression = expression;

	this.eval = function(env) {
	    return new interpreter.Closure(env, this);
	};
    };
    ast.Application = function(func, arg) {
	expectType(func, ast.Expression);
	expectType(arg, ast.Expression);
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
	expectType(pattern, ast.Pattern);
	expectType(def, ast.Expression);
	expectType(expr, ast.Expression);
	this.type = "Let";
	this.pattern = pattern;
	this.def = def;
	this.expr = expr;
	this.eval = function(env) {
	    return this.expr.eval(env.substitute(this.pattern, new Closure(env, this.def)));
	};
    };
    ast.Case = function(expr, cases) {
	expectType(expr, ast.Expression);
	// TODO: Expect cases [(Pattern, Expression)]
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
	expectTypeOf(identifier, "string");
	this.type = "VariableLookup";
	this.identifier = identifier;
	this.eval = function(env) {
	    return env.lookup(this.identifier);
	};
    };
    ast.Primitive = function(func) {
	expectTypeOf(func, "function");
	this.type="Primitive";
	this.func = func;
	this.eval = function(env) {
	    return this.func(env);
	};
    };

    ast.Constant.prototype          = new ast.Expression();
    ast.Lambda.prototype           = new ast.Expression();
    ast.Application.prototype       = new ast.Expression();
    ast.Let.prototype               = new ast.Expression();
    ast.Case.prototype              = new ast.Expression();
    ast.VariableLookup.prototype    = new ast.Expression();
    ast.Primitive.prototype     = new ast.Expression();
    
    ast.Constant.prototype.constructor = ast.Constant; 
    ast.Lambda.prototype.constructor = ast.Lambda; 
    ast.Application.prototype.constructor = ast.Application; 
    ast.Let.prototype.constructor = ast.Let; 
    ast.Case.prototype.constructor = ast.Case; 
    ast.VariableLookup.prototype.constructor = ast.VariableLookup; 
    ast.Primitive.prototype.constructor = ast.Primitive; 

    /*
      data Value = Num Int
    */
    ast.Value = function(){};

    ast.Num = function(num) {
	expectTypeOf(num, "number");
	this.type = "Num";
	this.num = num;
    };
       
    ast.Num.prototype = new ast.Value();
    /*
      data Declaration = Variable Pattern Expression
    */

    ast.Declaration = function(){};

    ast.Variable = function(pattern, expression) {
	expectType(pattern, ast.Pattern);
	expectType(expression, ast.Expression);
	this.type = "Variable";
	this.pattern = pattern;
	this.expression = expression;
    };

    ast.Variable.prototype = new ast.Declaration();

    /*
      Pattern = Constructor Identifier [Pattern]
              | VariableBinding Identifier
	      | Combined Identifier Pattern
	      | ConstantPattern Value
    */

    ast.Pattern = function(){};

    ast.Constructor = function(identifier, patterns) {
	expectTypeOf(identifier, "string");
	expectArrayType(patterns, ast.Pattern);
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
    };
    ast.ConstantPattern = function(value) {
	expectType(value, ast.Value);
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

    ast.Constructor.prototype     = new ast.Pattern();
    ast.VariableBinding.prototype = new ast.Pattern();
    ast.Combined.prototype        = new ast.Pattern();
    ast.ConstantPattern.prototype        = new ast.Pattern();

})(haskell.ast,haskell.interpreter);
