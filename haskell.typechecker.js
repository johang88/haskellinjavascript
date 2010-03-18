(function (typechecker, ast) {
     var astt = new ast.Module([
			       new ast.Variable(new ast.VariableBinding("inc"),
						new ast.Lambda(new ast.VariableBinding("x"),
							       new ast.Application(new ast.Application(new ast.VariableLookup("+"),
												       new ast.VariableLookup("x")),
										   new ast.Constant(new ast.Num(1))))),
			       new ast.Variable(new ast.VariableBinding("inc2"),
						new ast.Lambda(new ast.VariableBinding("x"),
							       new ast.Application(new ast.VariableLookup("inc"),
										   new ast.Application(new ast.VariableLookup("inc"),
												       new ast.VariableLookup("x"))))),
			       new ast.Variable(new ast.VariableBinding("main"),
						new ast.Application(new ast.VariableLookup("alert"),
								    new ast.Application(new ast.VariableLookup("inc2"),
											new ast.Constant(new ast.Num(2)))))
			   ]);
     var asttt = new ast.Application(new ast.Application(new ast.VariableLookup("+"),
							 new ast.VariableLookup("x")),
				     new ast.Constant(new ast.Num(1))); // ((x + :: (Num -> Num)) 1 :: Num)
     // asttt = new ast.Constant(new ast.Num(1));


     /*
      * data Kind = Star | Kfun Kind Kind
      *   deriving Eq
      * 
      */
     typechecker.Star = function() {
	 this.toString = function() { return "*"; };
     };
     typechecker.Kfun = function(kind1, kind2) {
	 this.kind1 = kind1;
	 this.kind2 = kind2;
	 this.toString = function() { return kind1.toString() + "->" + kind2.toString(); };
     };

     /*
      * data Tyvar = Tyvar Id Kind
      *   deriving Eq
      * 
      */
     typechecker.Tyvar = function(id, kind) {
	 this.id=id;
	 this.kind = function() { return kind; }; 
     };

     typechecker.Tycon = function(id, kind) {
	 this.kind = function() { return kind; };
     };

     /*
      * data Type = TVar Tyvar | TCon Tycon | TAp Type Type | TGen Int
      *   deriving Eq
      * 
      */
     typechecker.TVar = function(tyvar) {
	 this.kind = function() { return tyvar.kind(); };
	 this.apply = function(subst) {
	     if (subst[tyvar] != undefined) {
		 return subst[tyvar];
	     }
	     return (new typechecker.TVar(tyvar));
	 };
	 this.tv = function() { return [tyvar]; };
     };
     typechecker.TCon = function(tycon) {
	 this.kind = function() { return tycon.kind(); };
	 this.apply = function(subst) { return this; };
	 this.tv = function() { return []; };
     };
     typechecker.TAp = function(t1, t2) {
	 this.kind = function() { return t1.kind().kind2;  };
	 this.apply = function(subst) { return new typechecker.TAp(t1.apply(),t2.apply()); };
	 this.tv = function() { return [].concat(t1.tv()).concat(t2.tv()).unique(); };
     };
     typechecker.TGen = function() {
	 // this.kind = function() { }; - should probably throw an exception
	 this.apply = function(subst) { return this; };
	 this.tv = function() { return []; };
     };

     typechecker.test = function() {
	 alert(typechecker.tArrow.kind().toString());
     };

     /*
      * Some built-in types
      * 
      */
     typechecker.tUnit = new typechecker.TCon(
	 new typechecker.Tycon("()", new typechecker.Star()));
     typechecker.tChar = new typechecker.TCon(
	 new typechecker.Tycon("Char", new typechecker.Star()));
     typechecker.tInt = new typechecker.TCon(
	 new typechecker.Tycon("Int", new typechecker.Star()));
     typechecker.tInteger = new typechecker.TCon(
	 new typechecker.Tycon("Integer", new typechecker.Star()));
     typechecker.tFloat = new typechecker.TCon(
	 new typechecker.Tycon("Float", new typechecker.Star()));
     typechecker.tDouble = new typechecker.TCon(
	 new typechecker.Tycon("Double", new typechecker.Star()));

     typechecker.tList = new typechecker.TCon(
	 new typechecker.Tycon("[]",
			       new typechecker.Kfun(new typechecker.Star(),
						    new typechecker.Star())));
     typechecker.tArrow = new typechecker.TCon(
	 new typechecker.Tycon("(->)",
			       new typechecker.Kfun(
				   new typechecker.Star(),
				   new typechecker.Kfun(
				       new typechecker.Star(),
				       new typechecker.Star()))));
     typechecker.tTuple2 = new typechecker.TCon(
	 new typechecker.Tycon ("(,)",
				new typechecker.Kfun(
				    new typechecker.Star(),
				    new typechecker.Kfun(
					new typechecker.Star(),
					new typechecker.Star()))));

     /*
      * Substitutions
      * 
      * type Subst [(Tyvar, Type)]
      * 
      * We use a map (JavaScript Object) instead
      * 
      */
     typechecker.nullSubst = {};
     typechecker.singleSubst = function(u,t) { return {u: t}; };
     typechecker.composeSubst = function(s1, s2) {
	 var s3 = {};
	 for(var u in s2) {
	     s3[u] = s2[u].apply(s1);
	 }
	 for(var u in s1) {
	     s3[u] = s1[u];
	 }
	 return s3;
     };

}) (haskell.typechecker, haskell.ast);
