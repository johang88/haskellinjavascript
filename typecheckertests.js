var ast = haskell.ast;
var typechecker = haskell.typechecker;

function expectException(f, e) {
    try {
	f();
    } catch (x) {
	return x == e;
    }
    return false;
}
/*
var astt = new ast.Module(
    [
	new ast.Variable(
	    new ast.VariableBinding("inc"),
	    new ast.Lambda(
		new ast.VariableBinding("x"),
		new ast.Application(
		    new ast.Application(
			new ast.VariableLookup("+"),
			new ast.VariableLookup("x")),
		    new ast.Constant(new ast.Num(1))))),
	new ast.Variable(
	    new ast.VariableBinding("inc2"),
	    new ast.Lambda(
		new ast.VariableBinding("x"),
		new ast.Application(
		    new ast.VariableLookup("inc"),
		    new ast.Application(
			new ast.VariableLookup("inc"),
			new ast.VariableLookup("x"))))),
	new ast.Variable(
	    new ast.VariableBinding("main"),
	    new ast.Application(
		new ast.VariableLookup("alert"),
		new ast.Application(
		    new ast.VariableLookup("inc2"),
		    new ast.Constant(new ast.Num(2)))))
    ]);

var asttt = new ast.Application(
    new ast.Application(
	new ast.VariableLookup("+"),
	new ast.VariableLookup("x")),
    new ast.Constant(new ast.Num(1))); // ((x + :: (Num -> Num)) 1 :: Num)
*/
/*
 * Kinds
 * 
 */
(function() {
     fireunit.compare(
	 new typechecker.Star().toString(),
	 "*",
	 "Star is *");
     fireunit.compare(
	 new typechecker.Kfun(
	     new typechecker.Star(),
	     new typechecker.Star()).toString(),
	 "*->*",
	 "Kfun Star Star is *->*");
     fireunit.compare(
	 new typechecker.Kfun(
	     new typechecker.Kfun(
		 new typechecker.Star(),
		 new typechecker.Star()),
	     new typechecker.Star()).toString(),
	 "(*->*)->*",
	 "Kfun Kfun Star Star Star is (*->*)->*");
     fireunit.compare(
	 new typechecker.Kfun(
	     new typechecker.Star(),
	     new typechecker.Kfun(
		 new typechecker.Star(),
		 new typechecker.Star())).toString(),
	 "*->(*->*)",
	 "Kfun Star Kfun Star Star is *->(*->*)");
     fireunit.ok(
	 new typechecker.Star().equals(new typechecker.Star()),
	 "Star is equal to Star");
     fireunit.ok(
	 new typechecker.Kfun(
	     new typechecker.Star(),
	     new typechecker.Star()).equals(
		 new typechecker.Kfun(
		     new typechecker.Star(), new typechecker.Star())),
	 "Kfun Star Star is equal to Kfun Star Star");
     fireunit.ok(
	 !new typechecker.Kfun(
	     new typechecker.Star(),
	     new typechecker.Star()
	 ).equals(new typechecker.Star()),
	 "Kfun Star Star is not equal to Kfun Star");
}) ();

/*
 * TVar
 * 
 */
(function () {
     fireunit.ok(
	 new typechecker.TVar(
	     "a",
	     new typechecker.Star()
	 ).equals(new typechecker.TVar(
		      "a",
		      new typechecker.Star())),
     "Any TVar instances with common identifiers are equal");
     fireunit.ok(
	 !new typechecker.TVar(
	     "a",
	     new typechecker.Star()
	 ).equals(
	     new typechecker.TVar(
		 "b",
		 new typechecker.Star())),
	 "Two TVars are not equal if their names do not match");
}) ();

/*
 * Substitutions
 * 
 */
(function () {
     fireunit.ok(
	 new typechecker.TVar(
	     "a",
	     new typechecker.Star()
	 ).apply(
	     new typechecker.Subst(
		 {a: new typechecker.TVar(
		      "b",
		      new typechecker.Star())})
	 ).equals(
	     new typechecker.TVar(
		 "b",
	     new typechecker.Star())),
     "The simple substitution");
     fireunit.ok(
	 new typechecker.TAp(
	     new typechecker.TVar("a", new typechecker.Star()),
	     new typechecker.TVar("b", new typechecker.Star())
	 ).apply(
	     new typechecker.Subst(
		 {a: new typechecker.TVar(
		      "b",
		      new typechecker.Star()),
		  b: new typechecker.TVar(
		      "c",
		      new typechecker.Star())})
	 ).compare(
	 new typechecker.TAp(
	     new typechecker.TVar(
		 "b",
		 new typechecker.Star()),
	     new typechecker.TVar(
		 "c",
		 new typechecker.Star()))),
	 "Substitutions involving TAp");
     fireunit.ok(
	 new typechecker.TCon(
	     "[]",
	     new typechecker.Kfun(
		 new typechecker.Star(),
		 new typechecker.Star())
	 ).apply(
	     new typechecker.Subst({})
	 ).compare(
	 new typechecker.TCon(
	     "[]",
	     new typechecker.Kfun(
		 new typechecker.Star(),
		 new typechecker.Star()))),
	 "Type constructors are never substituted");
}) ();

/*
 * Operations on substitutions
 * 
 */
(function () {
     fireunit.ok(
	 new typechecker.Subst(
	     {a: new typechecker.TVar(
		  "b",
		  new typechecker.Star()),
	      c: new typechecker.TVar(
		  "d",
		  new typechecker.Star())}
	 ).compose(
	     new typechecker.Subst(
	     {g: new typechecker.TVar(
		  "a",
		  new typechecker.Star()),
	      h: new typechecker.TVar(
		  "b",
		  new typechecker.Star())})
	 ).compare(
	     new typechecker.Subst(
	     {a: new typechecker.TVar(
		  "b",
		  new typechecker.Star()),
	      c: new typechecker.TVar(
		 "d",
		 new typechecker.Star()),
	      g: new typechecker.TVar(
		  "b",
		  new typechecker.Star()),
	      h: new typechecker.TVar(
		  "b",
		  new typechecker.Star())})),
	 "c.apply(a.compose(b)) == c.apply(b).apply(a)");
 }) ();

/*
 * Unification
 * 
 */
(function() {
     fireunit.ok(
	 new typechecker.TCon(
	     "Int",
	     new typechecker.Star()
	 ).mgu(
	     new typechecker.TCon(
		 "Int",
		 new typechecker.Star())
	 ).compare(typechecker.nullSubst()),
     "Constructors of the same type and kind need no substitutions");
     fireunit.ok(
	 expectException(
	     function () {
		 new typechecker.TCon(
		     "Int",
		     new typechecker.Star()
		 ).mgu(
		     new typechecker.TCon(
			 "apa",
			 new typechecker.Star())); },
	     "types do not unify"),
	 "If we cannot unify we get an exception");
     fireunit.ok(
	 new typechecker.TVar(
	     "a",
	     new typechecker.Star()
	 ).mgu(
	     new typechecker.TVar(
	     "a",
	     new typechecker.Star())
	 ).compare(typechecker.nullSubst()),
	 "Identical type variables need not be substituted");
     fireunit.ok(
	 expectException(
	     function() {
		 new typechecker.TVar(
		     "a",
		     new typechecker.Star()
		 ).mgu(
		     new typechecker.TAp(
			 new typechecker.TVar(
			     "a",
			     new typechecker.Star()),
			 new typechecker.TVar(
			     "b",
			     new typechecker.Star()))); },
	     "occurs check fails"),
     "If one of the type variables depends on the other unification fails");
     fireunit.ok(
	 expectException(
	 function() {
	     new typechecker.TVar(
		 "a",
		 new typechecker.Star()
	     ).mgu(
		 new typechecker.TVar(
		     "b",
		 new typechecker.Kfun(
		     new typechecker.Star(),
		     new typechecker.Star())));
	 },
	 "kinds do not match"),
     "We cannot unify if kinds do not match");
     fireunit.ok(
	 new typechecker.TVar(
	     "a",
	     new typechecker.Star()
	 ).mgu(
	     new typechecker.TVar(
		 "b",
		 new typechecker.Star())
	 ).compare(
	     new typechecker.Subst(
		 {a: new typechecker.TVar(
		      "b",
		      new typechecker.Star())
		 })
	 ),
	 "If both variables are of the same kind substitute first with second");
     fireunit.ok(
	 new typechecker.TCon(
	     "Int",
	     new typechecker.Star()
	 ).mgu(
	     new typechecker.TVar(
		 "a",
		 new typechecker.Star())
	 ).compare(
	     new typechecker.Subst(
		 {a: new typechecker.TCon(
		      "Int",
		      new typechecker.Star())})),
	 "Same as previous but other order of application");
}) ();

/*
 * Type schemes
 * 
 */
(function() {
     fireunit.ok(
	 new typechecker.Scheme(
	     [new typechecker.Star()],
	     new typechecker.Qual(
		 [
		     new typechecker.Pred(
			 "Monad",
		     new typechecker.TVar(
			 "m",
			 new typechecker.Kfun(
			     new typechecker.Star(),
			     new typechecker.Star())))],
		 new typechecker.TAp(
		     new typechecker.TVar(
			 "m",
			 new typechecker.Kfun(
			     new typechecker.Star(),
			     new typechecker.Star())),
		     new typechecker.TGen(0)))
	 ).freshInst(
	     new typechecker.NameGen()
	 ).compare(
	     new typechecker.Qual(
		 [
		     new typechecker.Pred(
			 "Monad",
			 new typechecker.TVar(
			     "m",
			     new typechecker.Kfun(
				 new typechecker.Star(),
				 new typechecker.Star())))],
		 new typechecker.TAp(
		     new typechecker.TVar(
			 "m",
			 new typechecker.Kfun(
			     new typechecker.Star(),
			     new typechecker.Star())),
		     new typechecker.TVar(
			 "a0",
			 new typechecker.Star())))
	 ),
	 "TGens are substituted by their corresponding TVars");
}) ();

/*
 * Literals
 * 
 */
(function() {
     fireunit.ok(
	 new ast.Num(3
		    ).infer(new typechecker.NameGen()
			   ).preds[0].compare(
			       new typechecker.Pred("Num",
						   new typechecker.TVar(
						       "a0",
						       new typechecker.Star()))),
	 "Num literals are in the Num typeclass");
}) ();

/*
 * Patterns
 * 
 */
(function() {
     fireunit.ok(
	 new ast.Wildcard(
	 ).infer(
	     new typechecker.NameGen()
	 ).type.compare(
	     new typechecker.TVar(
		 "a0",
		 new typechecker.Star())),
	 "Wildcards are * type variables");
}) ();

/*
 * NameGen
 * 
 */
(function() {
     fireunit.compare(
	 new typechecker.NameGen().nextName(),
	 "a0",
	 "First name is a0");
     fireunit.ok(
	 typechecker.newTVar(
	     new typechecker.Star(),
	     new typechecker.NameGen()
	 ).compare(
	     new typechecker.TVar(
		 "a0",
		 new typechecker.Star()
	 )),
	 "Creating a new variable gives it a unique name and the assigned kind");
}) ();

fireunit.testDone();
