(function (typechecker, ast) {
     ast.Num.prototype.infer = function(env) {
	return new typechecker.Pred(
	    "Num",
	    env.newTVar(new typechecker.Star(), env));
     };

     ast.VariableLookup.prototype.infer = function(env) {
	 if(env[this.identifier] != undefined) {
	     return new typechecker.Pred("Num", new typechecker.TVar("a3", new typechecker.Star()));
	 }
     };

     /*
      * data Kind = Star | Kfun Kind Kind
      *   deriving Eq
      * 
      */
     typechecker.Star = function() {
	 this.toString = function() { return "*"; };
	 this.toStringNested = this.toString;
     };
     typechecker.Kfun = function(kind1, kind2) {
	 this.kind1 = kind1;
	 this.kind2 = kind2;
	 this.toString = function() {
	     return kind1.toStringNested() + "->" + kind2.toStringNested();
	 };
	 this.toStringNested = function() {
	     return "(" + this.toString() + ")"; };
     };

     /*
      * data Type = TVar Tyvar | TCon Tycon | TAp Type Type | TGen Int
      *   deriving Eq
      * 
      */
     typechecker.TVar = function(id, kind) {
	 this.toString = function () {
	     return this.id() + " (" + this.kind() + ")";
	 };
	 this.id = function () { return id; };
	 this.kind = function() { return kind; };
	 this.apply = function(subst) {
	     if (subst[this] != undefined) {
		 return subst[this];
	     }
	     return (new typechecker.TVar(this.id(), this.kind()));
	 };
	 this.tv = function() { return [tyvar]; };
     };
     
     /*
      typechecker.newTVar = function(kind, env) {
	 return new typechecker.TVar(env.nextName(), kind);
     };
      */

     typechecker.TCon = function(id, kind) {
	 this.id = function() { return id; };
	 this.kind = function() { return kind; };
	 this.apply = function(subst) { return this; };
	 this.tv = function() { return []; };
     };

     typechecker.TAp = function(t1, t2) {
	 this.kind = function() { return t1.kind().kind2;  };
	 this.apply = function(subst) {
	     return new typechecker.TAp(t1.apply(),t2.apply());
	 };
	 this.tv = function() {
	     return [].concat(t1.tv()).concat(t2.tv()).unique();
	 };
     };
     typechecker.TGen = function(id) {
	 this.id = function() { return id; };
	 this.apply = function(subst) { return this; };
	 this.tv = function() { return []; };

     };
/*
     typechecker.Class = function(ids, insts) {
	 this.ids = function() { return ids; };
	 this.insts = function() { return insts; };
     };

     typechecker.Inst = function() {
	 
     };
*/

     typechecker.Qual = function(preds, t) {
	 this.pred = function() { return preds; };
	 this.t = function() { return t; };
     };

     typechecker.Pred = function(class, type) {
	 this.class = function() { return class; };
	 this.type = function() { return type; };
	 this.toString = function() {
	     return this.class().toString() +
		 " " + 
		 this.type().id();
	 };
     };

     typechecker.Scheme = function(kinds, qual) {
	 this.kinds = function() { return kinds; };
	 this.qual = function() { return qual; };
	 this.freshInst = function() {};
     };

     typechecker.toScheme = function(type) {
	 return new typechecker.Scheme([], new typechecker.Qual([], type));
     };

/*
     typechecker.ClassEnv = function(classes, defaults) {
	 this.classes = function() { return classes; };
	 this.defaults = function() { return defaults; };
	 this.super = function(id) {
	     return this.classes(id).ids();
	 };
	 this.insts = function(id) {
	     return this.classes(id).insts();
	 };
     };
*/

     /*
      * Some built-in types
      * 
      */
     typechecker.tUnit
	 = new typechecker.TCon("()", new typechecker.Star());
     typechecker.tChar
	 = new typechecker.TCon("Char", new typechecker.Star());
     typechecker.tInt
	 = new typechecker.TCon("Int", new typechecker.Star());
     typechecker.tInteger
	 = new typechecker.TCon("Integer", new typechecker.Star());
     typechecker.tFloat
	 = new typechecker.TCon("Float", new typechecker.Star());
     typechecker.tDouble
	 = new typechecker.TCon("Double", new typechecker.Star());

     typechecker.tList = new typechecker.TCon(
	 "[]",
	 new typechecker.Kfun(new typechecker.Star(),
			      new typechecker.Star()));
     typechecker.tArrow = new typechecker.TCon(
	 "(->)",
	 new typechecker.Kfun(
	     new typechecker.Star(),
	     new typechecker.Kfun(
		 new typechecker.Star(),
		 new typechecker.Star())));
     typechecker.tTuple2 = new typechecker.TCon(
	 "(,)",
	 new typechecker.Kfun(
	     new typechecker.Star(),
	     new typechecker.Kfun(
		 new typechecker.Star(),
		 new typechecker.Star())));
     /*
      * Substitutions
      * 
      * type Subst [(Tyvar, Type)]
      * 
      * We use a map (JavaScript Object) instead
      * 
      */
/*
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
*/

     typechecker.NameGen = function(startAt) {
	 this.next = function(env) {
	     while(env["a" + startAt] != undefined) {
		 startAt++;
	     }
	     return "a" + startAt;
	 };
     };

     typechecker.Environment = function(init) {
	 if(init != undefined) {
	     for(i in init) {
		 this[i]=init[i];
	     }
	 }
	 var gen = new typechecker.NameGen(1);
	 this.nextName = function() { return gen.next(this); };
	 this.newTVar = function (kind) {
	     return new typechecker.TVar(this.nextName(), kind);
	 };
     };

     typechecker.emptyEnv = function() {
	 return new typechecker.Environment();
     };

}) (haskell.typechecker, haskell.ast);
