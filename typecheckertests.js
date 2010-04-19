var ast = haskell.ast;
var typechecker = haskell.typechecker;

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
}) ();

/*
 * Num
 * 
 */
(function() {
     fireunit.compare(
	 new ast.Num(1).infer(typechecker.emptyEnv()).toString(),
	 "Num a1",
	 "1 is Num a1"
     );
     fireunit.compare(
	 new ast.Num(1).infer(typechecker.emptyEnv()).class(),
	 "Num",
	 "1 is in Num");
     fireunit.compare(
	 new ast.Num(1).infer(typechecker.emptyEnv()).type().id(),
	 "a1",
	 "1 is a typevariable named a1");
}) ();

/*
 * VariableLookup
 * For example, using 
 * the Qual and Pred datatypes, the type (Num a) => a -> Int
 * can be represented by:
 * [IsIn "Num" (TVar (Tyvar "a" Star))] :=> (TVar (Tyvar "a" Star ) `fn` tInt)
 *
 */

(function() {
     fireunit.compare(
	 new ast.VariableLookup("x").infer(
	     new typechecker.Environment(
		 {x: new typechecker.Scheme(
		      [new typechecker.Pred(
			   "Num",
			   new typechecker.TVar("a3", new typechecker.Star()))],
		      new typechecker.TVar("a3", new typechecker.Star()))})).toString(),
	 "Num a3",
	 "x is Num a3");
})();

/*
 * Const
 * 
 */
(function() {
})();

/*
 * Type schemes
 * 
 */
(function() {
}) ();


/*
 * NameGen
 * 
 */
(function() {
     fireunit.compare(
	 new typechecker.NameGen(2).next({}),
	 "a2",
	 "should generate next free var");
     fireunit.compare(
	 new typechecker.NameGen(2).next({"a2":true}),
	 "a3",
	 "should get first free varname");
     fireunit.compare(
	 typechecker.emptyEnv().nextName(),
	 "a1",
	 "an environment has an associated name generator");
}) ();

fireunit.testDone();
