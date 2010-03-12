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

     ast.Application.prototype.infer = function() {
	 return undefined;
     };

     ast.Application.prototype.check = function(type) {
	 return this.infer() == type;
     };

     ast.Constant.prototype.check = function(type) {
	 return this.infer() == type;
     };

     ast.Constant.prototype.infer = function() {
	 if(this.hsType == undefined) {
	     this.hsType = this.value.infer();
	 }
	 return this.hsType;
     };

     ast.Num.prototype.infer = function() {
	 this.hsType = "Integer";
	 return "Integer";
     };

     ast.Num.prototype.check = function(type) {
	 return this.infer() == type;
     };

     ast.Variable.prototype.infer = function() {
	 if(this.hsType == undefined) {
	     this.hsType = this.expression.infer();
	 }
	 return this.hsType;
     };

     typechecker.Star = function() {
     };
     typechecker.Kfun = function(kind1, kind2) {
	 this.kind1 = kind1;
	 this.kind2 = kind2;
     };

     typechecker.Tyvar = function(id, kind) {
	this.kind = function() { return kind; }; 
     };

     typechecker.Tycon = function(id, kind) {
	this.kind = function() { return kind; };
     };

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
	 this.tv = function() { };
     };
     typechecker.TGen = function() {
	 // this.kind = function() { }; - should probably throw an exception
	 this.apply = function(subst) { return this; };
	 this.tv = function() { return []; };
     };

     typechecker.test = function() {
	 alert(asttt.infer());
	 alert(asttt.check("Integer"));
     };

}) (haskell.typechecker, haskell.ast);