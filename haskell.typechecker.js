(function (typechecker, ast) {
     Array.prototype.map = function(f) {
	 var ys = [];
	 for(var ii in this) {
	     ys[ii] = f(this[ii]);
	 }
	 return ys;
     };

     var inject = function(arr, f, acc) {
	 for(var ii in arr) {
	     acc = f(arr[ii], acc);
	 }
	 return acc;
     };


     uniqueBy = function(arr, comp) {
	 var ys = [];
	 var member = function(x) {
	     for(var ii in ys) {
		 if(comp(x, ys[ii])) {
		     return true;
		 }
	     }
	     return false;
	 };
	 for(var ii in arr) {
	     if(!member(arr[ii])) {
		 ys.push(arr[ii]);
	     }
	 }
	 return ys;
     };

     unionBy = function(arr, otherArray, comp) {
	 return arr.concat(otherArray).uniqueBy(comp);
     };


     ast.Num.prototype.infer = function(namegen) {
	 var v = typechecker.newTVar(new typechecker.Star(), namegen);
	 return {
	     preds: [new typechecker.Pred("Num", v)],
	     type: v
	 };
     };

     ast.Wildcard.prototype.infer = function(namegen) {
	 var v = typechecker.newTVar(new typechecker.Star(), namegen);
	 return {
	     preds: [],
	     assumps: [],
	     type: v
	 };
     };

     /*
      * data Kind = Star | Kfun Kind Kind
      *   deriving Eq
      * 
      */
     typechecker.Star = function() {
	 this.toString = function() { return "*"; };
	 this.toStringNested = this.toString;
	 this.equals = function(otherKind) { return otherKind.isStar(); };
	 this.isStar = function() { return true; };
     };
     typechecker.Kfun = function(kind1, kind2) {
	 this.kind1 = function() { return kind1; };
	 this.kind2 = function() { return kind2; };
	 this.toString = function() {
	     return this.kind1().toStringNested() +
		 "->" +
		 this.kind2().toStringNested();
	 };
	 this.toStringNested = function() {
	     return "(" + this.toString() + ")";
	 };
	 this.isStar = function() { return false; };
	 this.equals = function(otherKind) {
	     return !otherKind.isStar() &&
		 this.kind1().equals(otherKind.kind1()) &&
		 this.kind2().equals(otherKind.kind2());
	 };
     };

     /*
      * data Type = TVar Tyvar | TCon Tycon | TAp Type Type | TGen Int
      *   deriving Eq
      * 
      */
     typechecker.TVar = function(id, kind) {
	 this.type = function() { return "TVar"; };
	 this.toString = function () {
	     return this.id() + " (" + this.kind() + ")";
	 };
	 this.id = function () { return id; };
	 this.kind = function() { return kind; };
	 this.apply = function(subst) {
	     if (subst.lookup(this.id()) != undefined) {
		 return subst.lookup(this.id());
	     }
	     return (new typechecker.TVar(this.id(), this.kind()));
	 };
	 this.tv = function() {
	     return [new typechecker.TVar(this.id(), this.kind())]; };
	 this.equals = function (otherTVar) {
	     return this.id() == otherTVar.id();
	 };
	 this.compare = function(otherType) {
	     return otherType.type() == "TVar" && 
		 this.id() == otherType.id() &&
		 this.kind().equals(otherType.kind());
	 };
	 this.substWith = function(replaceWith) {
	     var s = {};
	     s[this.id()] = replaceWith;
	     return new typechecker.Subst(s);
	 };
	 this.mgu = function(otherType) {
	     if(this.compare(otherType)) {
		 return typechecker.nullSubst();
	     }
	     var tv = otherType.tv();
	     for(var ii in tv) {
		 if(this.compare(tv[ii])) {
		     throw "occurs check fails";
		 }
	     }
	     if(!this.kind().equals(otherType.kind())) {
		 throw "kinds do not match";
	     }
	     return this.substWith(otherType);
	 };
	 this.inst = function(ts) { return this; };
     };
     
      typechecker.newTVar = function(kind, namegen) {
	 return new typechecker.TVar(namegen.nextName(), kind);
      };

     typechecker.TCon = function(id, kind) {
	 this.type = function() { return "TCon"; };
	 this.id = function() { return id; };
	 this.kind = function() { return kind; };
	 this.apply = function(subst) { return this; };
	 this.tv = function() { return []; };
	 this.equals = function(otherTCon) {
	     return this.id() == otherTCon.id() &&
		 this.kind().equals(otherTCon.kind());
	 };
	 this.compare = function(otherType) {
	     return otherType.type() == "TCon" &&
		 this.id() == otherType.id() &&
		 this.kind().equals(otherType.kind());
	 };
	 this.mgu = function(otherType) {
	     if(otherType.type() == "TVar") {
		 return otherType.mgu(this);
	     }
	     if(this.compare(otherType)) {
		 return typechecker.nullSubst();
	     }
	     throw "types do not unify";
	 };
	 this.inst = function(ts) { return this; };
     };

     typechecker.TAp = function(t1, t2) {
	 this.t1 = function() { return t1; };
	 this.t2 = function() { return t2; };
	 this.type = function() { return "TAp"; };
	 this.kind = function() { return this.t1().kind().kind2(); };
	 this.apply = function(subst) {
	     return new typechecker.TAp(t1.apply(subst),t2.apply(subst));
	 };
	 this.tv = function() {
	     return t1.tv().concat(t2.tv());
	 };
	 this.compare = function(otherType) {
	     return otherType.type() == "TAp" &&
		 this.t1().compare(otherType.t1()) &&
		 this.t2().compare(otherType.t2());
	 };
	 this.inst = function(ts) {
	     return new typechecker.TAp(
		 this.t1().inst(ts),
		 this.t2().inst(ts));
	 };
     };
     typechecker.TGen = function(id) {
	 this.id = function() { return id; };
	 this.apply = function(subst) { return this; };
	 this.tv = function() { return []; };
	 this.inst = function(ts) { return ts[this.id()]; };
     };

     typechecker.Subst = function(mappings) {
	 this.inject = function(f, acc) {
	     for(var id in mappings) {
		 acc = f(id, mappings[id], acc);
	     }
	     return acc;
	 };
	 this.lookup = function(id) {
	     return mappings[id];
	 };
	 this.compose = function(otherSubst) {
	     var curSubst = this;
	     var newSubst = this.inject(
		 function(id, type, acc) {
		     acc[id] = type;
		     return acc;
		 },
		 {});
	     otherSubst.inject(
		 function(id, type, acc) {
		     acc[id] = type.apply(curSubst);
		     return acc;
		 },
		 newSubst);
	     return new typechecker.Subst(newSubst);
	 };
	 this.compare = function(otherSubst) {
	     var curSubst = this;
	     return this.inject(
		 function(id, type, acc) {
		     return acc &&
			 otherSubst.lookup(id) != undefined &&
			 type.compare(otherSubst.lookup(id));
		 },
		 true) &&
		 otherSubst.inject(
		     function(id, type, acc) {
			 return acc &&
			     curSubst.lookup(id) != undefined &&
			     type.compare(curSubst.lookup(id));
		     },
		     true);
	 };
     };
     typechecker.nullSubst = function() { return new typechecker.Subst({}); };
     
     typechecker.Qual = function(preds, t) {
	 this.preds = function() { return preds; };
	 this.t = function() { return t; };
	 this.apply = function(subst) {
	     return new typechecker.Qual(
		 preds.map(
		     function(pred) { return pred.apply(subst); }),
		 t.apply(subst));
	 };
	 this.tv = function() {
	     return this.preds().map(
		 function(pred) { return pred.tv(); }
	     ).concat(this.t().tv());
	 };
	 this.compare = function(otherQual) {
	     var otherPreds = otherQual.preds();
	     for(var p in preds) {
		 if(!preds[p].compare(otherPreds[p])) {
		     return false;
		 }
	     }
	     if(!t.compare(otherQual.t())) {
		 return false;
	     }
	     return true;
	 };
	 this.inst = function(ts) {
	     return new typechecker.Qual(
		 this.preds().map(
		     function(pred) { return pred.inst(ts); }),
		 this.t().inst(ts));
	 };
     };

     typechecker.Pred = function(id, type) {
	 this.id = function() { return id; };
	 this.type = function() { return type; };
	 this.apply = function(subst) { return this.type().apply(subst); };
	 this.mguPred = function(otherPred) {
	     if(this.id() == otherPred.id()) {
		 return this.type().mgu(otherPred.type());
	     }
	     throw "classes differ";
	 };
	 this.tv = function() { return this.type().tv(); };
	 this.compare = function(otherPred) {
	     return this.id() == otherPred.id() &&
		 this.type().compare(otherPred.type());
	 };
	 this.inst = function(ts) {
	     return new typechecker.Pred(this.id(), this.type().inst(ts));
	 };
     };

     typechecker.Scheme = function(kinds, qual) {
	 this.kinds = function() { return kinds; };
	 this.qual = function() { return this.qual; };
	 this.apply = function(subst) {
	     return new typechecker.Scheme(
		 this.kinds(),
		 this.qual().apply(subst));
	 };
	 this.tv = function() { return this.qual().tv(); };
	 this.freshInst = function(namegen) {
	     var ts = this.kinds().map(
		 function(kind) {
		     return typechecker.newTVar(kind, namegen);
		 });
	     return qual.inst(ts);
	 };
     };

     typechecker.Assump = function(id, scheme) {
	 this.id = function() { return id; };
	 this.scheme = function() { return scheme; };
     };

     typechecker.NameGen = function() {
	 var curr = 0;
	 this.nextName = function() {
	     var ret = curr;
	     curr++;
	     return "a" + ret;
	 };
     };

}) (haskell.typechecker, haskell.ast);
