(function(interpreter, ast, primitives){
    // Creates env from an ast and returns it !
    interpreter.prepare = function(astt, env) {
        for (var i in astt.declarations) {
            var decl = astt.declarations[i];
	    if (decl.type=="Variable") {
		env.patternBind(decl.pattern, new interpreter.Closure(env, decl.expression));
	    }
	    else if (decl.type=="Data") {
		for (var i in decl.constructors) {
		    constr = decl.constructors[i];
		    env.bind(constr.identifier, primitives.createDataConstructorKludge(env, constr.identifier, constr.number));
		};
	    };
        };
        return env;
    };

    interpreter.execute = function(astt) {
	var env = new interpreter.RootEnv();
	// Only fun defs atm
	interpreter.prepare(astt, env);
	primitives.init(env);
	return env.lookup("main").force();
    };

    interpreter.eval = function(astt, env) {
	return (new interpreter.Closure(env, astt)).force();
    }; 

     // Live data
    /*
     data Env = RootEnv [(Identifier, Pattern, Thunk)|(Identifier, Thunk)]
              | ChildEnv [(Identifier, Pattern, Thunk)|(Identifier, Thunk)] Env
    */
    interpreter.Env = function() {

    };

    interpreter.Env.prototype.substitute = function(pattern, expression) {
	var newEnv = this.derive();
	newEnv.patternBind(pattern, expression);
	return newEnv;
    };
    interpreter.Env.prototype.derive = function() {
	return new interpreter.ChildEnv(this);
    };
    interpreter.Env.prototype.patternBind = function(pattern, expression) {
	var vars = pattern.vars();
	for (var i in vars) {
	    this.env[vars[i]] = [pattern, expression];
	    this.env[vars[i]].type = "unforced";
	}
    };
    interpreter.Env.prototype.bind = function(identifier, expr) {
	this.env[identifier] = expr;
    };
    interpreter.Env.prototype.lookup = function(identifier) {
	if (this.env[identifier]==undefined) {
	    return this.onUndefined(identifier);
	};
	var found = this.env[identifier];
	if (found.type == "unforced") {
	    if (!found[0].match(this, found[1])) {
		alert("Unrefutable pattern failed");
	    };
	};
	return this.env[identifier];
    };
    interpreter.Env.prototype.onUndefined = function(identifier) {
	return undefined;
    };

  
    interpreter.RootEnv = function() {
	this.env = {};
	this.type = "RootEnv";
    };
    interpreter.RootEnv.prototype = new interpreter.Env();
    interpreter.RootEnv.prototype.constructor = interpreter.RootEnv;

    interpreter.ChildEnv = function(parent) {
	this.env = {};
	this.type = "ChildEnv";
	this.parent = parent;
    };
    interpreter.ChildEnv.prototype = new interpreter.Env();
    interpreter.ChildEnv.prototype.constructor = interpreter.ChildEnv;

    interpreter.ChildEnv.prototype.onUndefined = function(identifier) {
	return this.parent.lookup(identifier);
    };


    /*
     data Thunk = Closure Env Expression
                | ConstantThunk Value
	        | Data Identifier [Thunk]
	        | Primitive Env Function
		| PrimData -- Javascript data
    */
    interpreter.Closure = function(env, expression) {
	this.type = "Closure";
	this.env = env;
	this.expression = expression;
	this.forced = undefined;
    };
    interpreter.Closure.prototype.force = function() {
	if (this.forced == undefined) {
	    this.forced = this.expression.eval(this.env);
	}
	// Forcing a closure is the same as evaluating its expression under the closures env
	return this.forced;
    };

    interpreter.ConstantThunk = function(value) {
	this.type = "ConstantThunk";
	this.value = value;
    };
    interpreter.ConstantThunk.prototype.force = function() {
	return this;
    };

    interpreter.Data = function(identifier, thunks) {
	this.type = "Data";
	this.identifier = identifier;
	this.thunks = thunks;
    };
    interpreter.Data.prototype.force = function() {
	// Data is already forced...
	return this;
    };
})(haskell.interpreter, haskell.ast, haskell.primitives);
