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
	     ).add(
		 new typechecker.TVar(
		     "a",
		     new typechecker.Star()),
		 new typechecker.TVar(
		      "b",
		      new typechecker.Star()))
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
	     ).add(
		 new typechecker.TVar(
		     "a",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "b",
		     new typechecker.Star())
	     ).add(
		 new typechecker.TVar(
		     "b",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "c",
		     new typechecker.Star()))
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
	     new typechecker.Subst()
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
	 ).add(
	     new typechecker.TVar(
		 "a",
		 new typechecker.Star()),
	     new typechecker.TVar(
		 "b",
		 new typechecker.Star())
	 ).add(
	     new typechecker.TVar(
		 "c",
		 new typechecker.Star()),
	     new typechecker.TVar(
		 "d",
		 new typechecker.Star())
	 ).compose(
	     new typechecker.Subst(
	     ).add(
		 new typechecker.TVar(
		     "g",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "a",
		     new typechecker.Star())
	     ).add(
		 new typechecker.TVar(
		     "h",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "b",
		     new typechecker.Star()))
	 ).compare(
	     new typechecker.Subst(
	     ).add(
		 new typechecker.TVar(
		     "a",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "b",
		     new typechecker.Star())
	     ).add(
		 new typechecker.TVar(
		     "c",
			 new typechecker.Star()),
		 new typechecker.TVar(
		     "d",
		     new typechecker.Star())
	     ).add(
		 new typechecker.TVar(
		     "g",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "b",
		     new typechecker.Star())
	     ).add(
		 new typechecker.TVar(
		     "h",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "b",
		     new typechecker.Star()))),
	 "c.apply(a.compose(b)) == c.apply(b).apply(a)");
     fireunit.ok(
	 new typechecker.Subst(
	 ).add(
	     new typechecker.TVar(
		 "a",
		 new typechecker.Star()),
	     new typechecker.TVar(
		 "b",
		 new typechecker.Star())
	 ).merge(
	     new typechecker.Subst(
	     ).add(
		 new typechecker.TVar(
		     "a",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "b",
		     new typechecker.Star())
	     ).add(
		 new typechecker.TVar(
		     "c",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "d",
		 new typechecker.Star()))
	 ).compare(
	     new typechecker.Subst(
	     ).add(
		 new typechecker.TVar(
		     "a",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "b",
		     new typechecker.Star())
	     ).add(
		 new typechecker.TVar(
		     "c",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "d",
		     new typechecker.Star()))),
	 "Merging to substitutions produces a merged substitution");
     fireunit.ok(
	 expectException(
	     function() {
		 new typechecker.Subst(
		 ).add(
		     new typechecker.TVar(
			 "a",
			 new typechecker.Star()),
		     new typechecker.TVar(
			 "b",
		     new typechecker.Star())
		 ).merge(
		     new typechecker.Subst(
		     ).add(
			 new typechecker.TVar(
			     "a",
			     new typechecker.Star()),
			 new typechecker.TVar(
			     "c",
			     new typechecker.Star())));
	     },
	     "merge fails"),
	 "merge can only be performed if the two substitutions agree");
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
	     ).add(
		 new typechecker.TVar(
		     "a",
		     new typechecker.Star()),
		 new typechecker.TVar(
		     "b",
		     new typechecker.Star()))),
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
	     ).add(
		 new typechecker.TVar(
		     "a",
		     new typechecker.Star()),
		 new typechecker.TCon(
		     "Int",
		     new typechecker.Star()))),
     "Same as previous but other order of application");
     fireunit.ok(
	 new typechecker.TAp(
	     new typechecker.TVar(
		 "a",
		 new typechecker.Kfun(
		     new typechecker.Star(),
		     new typechecker.Star())),
	     new typechecker.TVar(
		 "b",
		 new typechecker.Star())
	 ).mgu(
	     new typechecker.TAp(
		 new typechecker.TVar(
		     "c",
		     new typechecker.Kfun(
			 new typechecker.Star(),
			 new typechecker.Star())),
		 new typechecker.TCon(
		     "Char",
		     new typechecker.Star()))
	 ).compare(
	     new typechecker.Subst(
	     ).add(
		 new typechecker.TVar(
		     "a",
		     new typechecker.Kfun(
			 new typechecker.Star(),
			 new typechecker.Star())),
		 new typechecker.TVar(
		     "c",
		     new typechecker.Kfun(
			 new typechecker.Star(),
			 new typechecker.Star()))
	     ).add(
		 new typechecker.TVar(
		     "b",
		     new typechecker.Star()),
		 new typechecker.TCon(
		     "Char",
		     new typechecker.Star()))),
	 "Unification of type applications is done by composing the underlying substitutions");
     fireunit.ok(
	 new typechecker.TVar(
	     "a",
	 new typechecker.Star()
	 ).match(
	     new typechecker.TCon(
		 "Char",
		 new typechecker.Star())
	 ).compare(
	     new typechecker.Subst(
	     ).add(
		 new typechecker.TVar(
		     "a",
		     new typechecker.Star()),
		 new typechecker.TCon(
		     "Char",
		     new typechecker.Star()))),
	 "A type variable can match anything of the same kind");
     fireunit.ok(
	 expectException(
	     function() {
		 new typechecker.TVar(
		     "a",
		     new typechecker.Star()
		 ).match(
		     new typechecker.TCon(
			 "[]",
			 new typechecker.Kfun(
			     new typechecker.Star(),
			     new typechecker.Star())));
		 },
		 "types do not match"),
	     "If kinds are not same matching is impossible");
     fireunit.ok(
	 new typechecker.TCon(
	     "Char",
	     new typechecker.Star()
	 ).match(
	     new typechecker.TCon(
		 "Char",
		 new typechecker.Star())
	 ).compare(
	     new typechecker.Subst()),
	 "Matching type constructors need no substitution");
     fireunit.ok(
	 expectException(
	     function() {
		 new typechecker.TCon(
		     "Char",
		     new typechecker.Star()
		 ).match(
		     new typechecker.TCon(
			 "Int",
			 new typechecker.Star()));
	     },
	     "types do not match"),
	 "You cannot substitute one type into another");
     fireunit.ok(
	 new typechecker.TAp(
	     new typechecker.TVar(
		 "m",
		 new typechecker.Kfun(
		     new typechecker.Star(),
		     new typechecker.Star())),
	     new typechecker.TCon(
		 "Char",
		 new typechecker.Star())
	 ).match(
	     new typechecker.TAp(
		 new typechecker.TVar(
		     "k",
		     new typechecker.Kfun(
			 new typechecker.Star(),
			 new typechecker.Star())),
		 new typechecker.TCon(
		     "Char",
		     new typechecker.Star()))
	 ).compare(
	     new typechecker.Subst(
	     ).add(
		 new typechecker.TVar(
		     "m",
		     new typechecker.Kfun(
			 new typechecker.Star(),
			 new typechecker.Star())),
		 new typechecker.TVar(
		     "k",
		     new typechecker.Kfun(
			 new typechecker.Star(),
			 new typechecker.Star())))),
	 "Type applications just operates recursively on the underlying types");
     fireunit.ok(
	 expectException(
	     function() {
		 new typechecker.TAp(
		     new typechecker.TVar(
			 "m",
			 new typechecker.Kfun(
			     new typechecker.Star(),
			     new typechecker.Star())),
		     new typechecker.TCon(
			 "Char",
			 new typechecker.Star())
		 ).match(
		     new typechecker.TVar(
			 "a",
			 new typechecker.Star()));
	     },
	     "types do not match"),
	 "Type applications can only match other applications");
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
     fireunit.ok(
	 new ast.VariableBinding(
	     "x"
	 ).infer(
	     new typechecker.NameGen()
	 ).type.compare(
	     new typechecker.TVar(
		 "a0",
		 new typechecker.Star())),
	 "Bind the new variable and create a type variable for it");
     fireunit.ok(
	 new ast.Combined(
	     "x",
	     new ast.Wildcard()
	 ).infer(
	     new typechecker.NameGen()
	 ).type.compare(
	     new typechecker.TVar(
		 "a0",
	     new typechecker.Star())),
	 "Combined pattern");
     fireunit.ok(
	 new ast.ConstantPattern(
	     new ast.Num(3)
	 ).infer(
	     new typechecker.NameGen()
	 ).type.compare(
	     new typechecker.TVar(
		 "a0",
	     new typechecker.Star())),
	 "Constant pattern");
     fireunit.ok(
	 new ast.ConstantPattern(
	     new ast.Num(3)
	 ).infer(
	     new typechecker.NameGen()
	 ).preds[0].compare(
	     new typechecker.Pred(
		 "Num",
	     new typechecker.TVar(
		 "a0",
		 new typechecker.Star()))),
	 "Constant pattern2");

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

/* 
 * Context reduction
 * 
 */
(function() {
     fireunit.ok(
	 new typechecker.Pred(
	     "Num",
	     new typechecker.TVar(
		 "a0",
		 new typechecker.Star())
	 ).inHnf(),
	 "A type variable is in hnf");
     fireunit.ok(
	 !new typechecker.Pred(
	     "Num",
	     new typechecker.TCon(
		 "Int",
		 new typechecker.Star())
	 ).inHnf(),
	 "A type constructor is not in hnf");
     fireunit.ok(
	 new typechecker.Pred(
	     "Num",
	     new typechecker.TAp(
		 new typechecker.TVar(
		     "a0",
		     new typechecker.Star()),
	     new typechecker.TCon(
		 "Int",
		 new typechecker.Star()))
	 ).inHnf(),
	 "An application is in hnf if its first argument is");
})();

/*
 * KlassEnvironment
 * 
 */
(function() {
     fireunit.ok(
	 new typechecker.KlassEnvironment(
	 ).addClass(
	     "Eq",
	     []
	 ).lookup(
	     "Eq"
	 ).supers().length == 0,
	 "Here we have no supers");
     fireunit.ok(
	 new typechecker.KlassEnvironment(
	 ).addClass(
	     "Eq",
	     []
	 ).addClass(
	     "Ord",
	     ["Eq"]
	 ).lookup(
	     "Ord"
	 ).supers()[0] == "Eq",
	 "Here we have one super");
     fireunit.ok(
	 new typechecker.KlassEnvironment(
	 ).addClass(
	     "Eq",
	     []
	 ).defined("Eq"),
	 "Eq is defined");
     fireunit.ok(
	 new typechecker.KlassEnvironment(
	 ).addClass(
	     "Eq",
	     []
	 ).addClass(
	     "Ord",
	     ["Eq"]
	 ).addInst(
	     [],
	     new typechecker.Pred(
		 "Ord",
		 new typechecker.TCon(
		     "Int",
		     new typechecker.Star()))
	 ).bySuper(
	     new typechecker.Pred(
		 "Ord",
		 new typechecker.TCon(
		     "Int",
		     new typechecker.Star()))
	 )[1].compare(
	     new typechecker.Pred(
		 "Eq",
		 new typechecker.TCon(
		     "Int",
		     new typechecker.Star()))),
	 "Superclass of Ord is Eq");
/*
     fireunit.ok(
	 new typechecker.KlassEnvironment(
	 ).addClass(
	     "Eq",
	     []
	 ).addInst(
	     [
	     new typechecker.Pred],
	     new typechecker.Pred(
		 "Eq",
		 new typechecker.TCon(
		     "Int",
		     new typechecker.Star()))
	 );
  */   
     

})();

fireunit.testDone();
