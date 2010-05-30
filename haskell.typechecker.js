
(function (typechecker, ast) {

     var inject = function(arr, f, acc) {
	 for(var ii in arr) {
	     acc = f(arr[ii], acc);
	 }
	 return acc;
     };

     var injectRight = function(arr, f, acc) {
	 for(var ii = arr.length-1; ii >= 0; ii--) {
	     acc = f(arr[ii], acc);
	 }
	 return acc;
     };

     typechecker.injectRight = injectRight;
     typechecker.inject = inject;

     var any = function(arr, f) {
	 return inject(
	     arr,
	     function(p, acc) {
		 return f(p) || acc;
	     },
	     false);
     };

     var elem = function(arr, p) {
	 return any(
	     arr,
	     function(pp) {
		 return p.compare(pp);
	     });
     };
     typechecker.elem = elem;
     typechecker.any = any;

     var all = function(arr, f) {
	 return inject(
	     arr,
	     function(p, acc) {
		 return f(p) && acc;
	     },
	     true);
     };

     typechecker.all = all;     

     var uniqueBy = function(arr, comp) {
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

     var flatten = function(arr) {
	 return inject(
	     arr,
	     function(a, acc) {
		 return acc.concat(a);
	     },
	     []);
     };

     typechecker.flatten = flatten;

     var unionBy = function(arr, otherArray, comp) {
	 return uniqueBy(arr.concat(otherArray), comp);
     };

     var intersectBy = function(arr, otherArray, comp) {
	 return inject(
	     arr,
	     function(a, acc) {
		 if(any(
			otherArray,
			function(b) {
			    return comp(a, b);
			})) {
		     return acc.concat([a]);
		 }
		 return acc;
	     },
	     []
	 );
     };

     var filter = function(arr, f) {
	 return inject(
	     arr,
	     function(a, acc) {
		 if(f(a)) {
		     return acc.concat([a]);
		 }
		 return acc;
	     },
	     []
	 );
     };

     var diff = function(arr, diffArr){
	 return inject(
	     arr,
	     function(a, acc) {
		 if(!elem(diffArr, a)) {
		     return acc.concat([a]);
		 }
		 return acc;
	     },
	     []);
     };

     typechecker.filter = filter;
     typechecker.unionBy = unionBy;
     typechecker.intersectBy = intersectBy;

     ast.Expression.prototype.infer = function(env) {
	 return this.desugar().infer(env);
     };

     ast.Constant.prototype.infer = function(env) {
	 return this.value.infer(env);
     };

     ast.Num.prototype.infer = function(env) {
	 var v = typechecker.newTVar(new typechecker.Star(), env);
	 return {
	     preds: [new typechecker.Pred("Num", v)],
	     type: v
	 };
     };

     ast.VariableLookup.prototype.infer = function(env) {
	 var a = env.lookup(this.identifier);
	 var inst = a.freshInst(env); 
	 return {
	     preds: inst.preds(),
	     type: inst.t()
	 };
     };

     ast.Application.prototype.infer = function(env) {
	 var fInf = this.func.infer(env);
	 var argInf = this.arg.infer(env);
	 var t = env.newTVar(new typechecker.Star());
	 env.unify(typechecker.fn(argInf.type, t), fInf.type);
	 return {
	     preds: fInf.preds.concat(argInf.preds),
	     type: t
	 };
     };

     ast.Case.prototype.infer = function(env) {
	 var condT = this.expr.infer(env);
	 var tp = env.newTVar(new typechecker.Star());
	 var te = env.newTVar(new typechecker.Star());
	 env.unify(tp, condT.type);
	 var ps = condT.preds;
	 this.cases.map(
	     function(c) {
		 var patT = c[0].infer(env);
		 env.unify(tp, patT.type);
		 var childEnv = env.createChild();
		 childEnv.addMany(patT.assumps);
		 var exprT = c[1].infer(childEnv);
		 env.unify(te, exprT.type);
		 ps = ps.concat(patT.preds).concat(exprT.preds);
	     });
	 return {
	     preds: ps,
	     type: te
	 };
     };

     ast.ConstantPattern.prototype.infer = function(env) {
	 var inf = this.value.infer(env);
	 return {
	     preds: inf.preds,
	     assumps: [],
	     type: inf.type
	 };	     
     };

     ast.PatternConstructor.prototype.infer = function(env) {
	 var sc = env.lookup(this.identifier);
	 var ps = [];
	 var ts = [];
	 var as = [];
	 this.patterns.map(
	     function(pat) {
		 var patInf = pat.infer(env);
		 ps = ps.concat(patInf.preds);
		 ts = ts.concat([patInf.type]);
		 as = as.concat(patInf.assumps);
	     }
	 );
	 var rt = env.newTVar(new typechecker.Star());
	 var inst = sc.freshInst(env);
	 var infert = injectRight(
	     ts,
	     function(t, acc) {
		 return typechecker.fn(t, acc);
	     },
	     rt
	 );
	 env.unify(inst.t(), infert);
	 return {
	     preds: ps,
	     assumps: as,
	     type: rt
	 };
     };

     ast.Combined.prototype.infer = function(env) {
	 var t = this.pattern.infer(env);
	 return {
	     preds: t.preds,
	     assumps: [
		 new typechecker.Assump(
		     this.identifier,
		     typechecker.toScheme(t.type))
		 ],
	     type: t.type
	 };
     };

     ast.VariableBinding.prototype.infer = function(env) {
	 var v = typechecker.newTVar(new typechecker.Star(), env);
	 return {
	     preds: [],
	     assumps: [
		 new typechecker.Assump(
		     this.identifier,
		     typechecker.toScheme(v))
	     ],
	     type: v
	 };
     };

     ast.Wildcard.prototype.infer = function(env) {
	 var v = typechecker.newTVar(new typechecker.Star(), env);
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

     typechecker.Type = function() {
	 
     };

     /*
      * data Type = TVar Tyvar | TCon Tycon | TAp Type Type | TGen Int
      *   deriving Eq
      * 
      */
     typechecker.TVar = function(id, kind) {
	 this.type = function() { return "TVar"; };
	 this.toString = function () {
	     return this.id();
	 };
	 this.toStringNested = this.toString;
	 this.id = function () { return id; };
	 this.kind = function() { return kind; };
	 this.apply = function(subst) {
	     if (subst.lookup(this) != undefined) {
		 return subst.lookup(this);
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
	     return new typechecker.Subst().add(
		 this,
		 replaceWith);
	 };
	 this.mgu = function(otherType) {
	     if(this.compare(otherType)) {
		 return typechecker.nullSubst();
	     }
	     if(elem(otherType.tv(), this)) {
		     throw "occurs check fails";
	     }
	     if(!this.kind().equals(otherType.kind())) {
		 throw "kinds do not match";
	     }
	     return this.substWith(otherType);
	 };
	 this.match = function(otherType) {
	     if(!otherType.kind().equals(this.kind())) {
		 throw "types do not match";
	     }
	     return this.substWith(otherType);
	 };
	 this.inst = function(ts) { return this; };
	 this.hnf = function() { return true; };
     };
     
      typechecker.newTVar = function(kind, env) {
	 return new typechecker.TVar(env.nextName(), kind);
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
	 this.match = function(otherType) {
	     if(otherType.compare(this)) {
		 return typechecker.nullSubst();
	     }
	     throw "types do not match";
	 };
	 this.inst = function(ts) { return this; };
	 this.hnf = function() { return false; };
	 this.toString = function() {
	     return this.id();
	 };
	 this.toStringNested = this.toString;
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
	     if(t1.type() == "TVar" &&
		t2.type() == "TVar" &&
		t1.compare(t2)) {
		 return [t1];
	     }
	     return unionBy(
		 t1.tv(),
		 t2.tv(),
		 function(a, b) {
		     return a.compare(b);
		 });
	 };
	 this.mgu = function(otherType) {
	     if(otherType.type() == "TVar") {
		 return otherType.mgu(this);
	     }
	     if(otherType.type() == "TAp") {
		 var s1 = this.t1().mgu(otherType.t1());
		 var s2 = this.t2().apply(s1).mgu(otherType.t2().apply(s1));
		 return s2.compose(s1);
	     }
	     throw "types do not unify";
	 };
	 this.match = function(otherType) {
	     if(otherType.type() == "TAp") {
		 var s1 = this.t1().match(otherType.t1());
		 var s2 = this.t2().match(otherType.t2());
		 return s1.merge(s1, s2);
	     }
	     throw "types do not match";
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
	 this.hnf = function() {
	     return this.t1().hnf();
	 };
	 this.toString = function() {
	     return this.t1().toStringNested()
		 + " " + this.t2().toStringNested();
	 };
	 this.toStringNested = function() {
	     return "(" + this.toString() + ")";
	 };
     };
     typechecker.TGen = function(id) {
	 this.id = function() { return id; };
	 this.apply = function(subst) { return this; };
	 this.tv = function() { return []; };
	 this.inst = function(ts) { return ts[this.id()]; };
	 this.toString = function() {
	     return "g" + this.id();
	 };
	 this.toStringNested = this.toString;
     };

     typechecker.TVar.prototype = new typechecker.Type();
     typechecker.TCon.prototype = new typechecker.Type();
     typechecker.TAp.prototype = new typechecker.Type();
     typechecker.TGen.prototype = new typechecker.Type();

     typechecker.tArrow = function() {
	 return new typechecker.TCon(
	     "(->)",
	     new typechecker.Kfun(
		 new typechecker.Star(),
		 new typechecker.Kfun(
		     new typechecker.Star(),
		     new typechecker.Star())));
     };
     typechecker.fn = function(a,b) {
	 var fn = new typechecker.TAp(
	     new typechecker.TAp(
		 typechecker.tArrow(),
		 a),
	     b);
	 fn.toString = function() {
	     return a.toString() + " -> " + b.toString();
	 };
	 fn.toStringNested = fn.toString;
	 return fn;
     };

     typechecker.tBool = 
	 new typechecker.TCon(
	     "Bool",
	     new typechecker.Star());

     typechecker.Subst = function() {
	 var mappings = {};
	 this.add = function(from, to) {
	     if(this.exists(to)) {
		 to = to.apply(this);
	     }
	     mappings[from.id()] = {
		 from: from,
		 to: to
	     };
	     return this;
	 };
	 this.inject = function(f, acc) {
	     for(var id in mappings) {
		 acc = f(mappings[id].from, mappings[id].to, acc);
	     }
	     return acc;
	 };
	 this.lookup = function(v) {
	     return (mappings[v.id()] != undefined &&
		     mappings[v.id()].from.compare(v)) ?
		 mappings[v.id()].to :
		 undefined;
	 };
	 this.exists = function(v) {
	     return this.lookup(v) != undefined;
	 };
	 this.compose = function(otherSubst) {
	     var curSubst = this;
	     var newSubst = this.inject(
		 function(from, to, acc) {
		     return acc.add(from, to);
		 },
		 new typechecker.Subst());
	     return otherSubst.inject(
		 function(from, to, acc) {
		     return acc.add(from, to.apply(curSubst));
		 },
		 newSubst);
	 };
	 this.merge = function(otherSubst) {
	     var newSubst = this.inject(
		 function(from, to, acc) {
		     return acc.add(from, to);
		 },
		 new typechecker.Subst());
	     otherSubst.inject(
		 function(from, to, acc) {
		     if(acc.exists(from) && !acc.lookup(from).compare(to)) {
			     throw "merge fails";
		     }
		     return acc.add(from, to);
		 },
		 newSubst);
	     return newSubst;
	 };
	 this.compare = function(otherSubst) {
	     var curSubst = this;
	     return this.inject(
		 function(from, to, acc) {
		     return acc &&
			 otherSubst.lookup(from) != undefined &&
			 to.compare(otherSubst.lookup(from));
		 },
		 true) &&
		 otherSubst.inject(
		     function(from, to, acc) {
			 return acc &&
			     curSubst.lookup(from) != undefined &&
			     to.compare(curSubst.lookup(from));
		     },
		     true);
	 };
	 this.toString = function() {
	     return this.inject(
		 function(from, to, acc) {
		     return from.toString() + ": " + to.toString() + ",";
		 });
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
	 this.quantify = function(vs) {
	     var vss = this.tv().filter(
		 function(v) {
		     return elem(vs, v);
		 });
	     var ks = vss.map(
		 function(vv) {
		     return vv.kind();
		 });
	     var i = 0;
	     var s = inject(
		 vss,
		 function(vv, acc) {
		     acc.add(vv, new typechecker.TGen(i));
		     i++;
		     return acc;
		 });
	     return new typechecker.Scheme(
		 ks,
		 this.apply(s));
	 };
	 this.toString = function() {
	     return this.t().toString();
	 };
     };

     typechecker.Pred = function(id, type) {
	 this.id = function() { return id; };
	 this.type = function() { return type; };
	 this.apply = function(subst) {
	     return new typechecker.Pred(
		 this.id(),
		 this.type().apply(subst)
	     );
	 };
	 this.mguPred = function(otherPred) {
	     if(this.id() == otherPred.id()) {
		 return this.type().mgu(otherPred.type());
	     }
	     throw "classes differ";
	 };
	 this.matchPred = function(otherPred) {
	     if(this.id() == otherPred.id()) {
		 return this.type().match(otherPred.type());
	     }
	     throw "classes differ";
	 };
	 this.overlap = function(otherPred) {
	     try {
		 this.mguPred(otherPred);
	     } catch (x) {
		 return false;
	     }
	     return true;
	 };
	 this.tv = function() { return this.type().tv(); };
	 this.compare = function(otherPred) {
	     return this.id() == otherPred.id() &&
		 this.type().compare(otherPred.type());
	 };
	 this.inst = function(ts) {
	     return new typechecker.Pred(this.id(), this.type().inst(ts));
	 };
	 this.inHnf = function() {
	     return this.type().hnf();
	 };
	 this.toString = function() {
	     return this.id() + " " + this.type();
	 };
     };

     typechecker.Scheme = function(kinds, qual) {
	 this.kinds = function() { return kinds; };
	 this.qual = function() { return qual; };
	 this.apply = function(subst) {
	     return new typechecker.Scheme(
		 this.kinds(),
		 this.qual().apply(subst));
	 };
	 this.tv = function() { return this.qual().tv(); };
	 this.freshInst = function(env) {
	     var ts = this.kinds().map(
		 function(kind) {
		     return typechecker.newTVar(kind, env);
		 });
	     return this.qual().inst(ts);
	 };
	 this.toString = function() {
	     return this.qual().toString();
	 };
     };

     typechecker.toScheme = function(type) {
	 return new typechecker.Scheme(
	     [],
	     new typechecker.Qual(
		 [],
		 type));
     };

     typechecker.Assump = function(id, scheme) {
	 this.id = function() { return id; };
	 this.scheme = function() { return scheme; };
	 this.toString = function() {
	     return this.id() + " :: " + this.scheme().toString();
	 };
     };

     typechecker.Assumps = function(parent) {
	 parent = parent == undefined ? { 
	     lookup: function() {
		 throw "no such identifier";
	     }
	 } : parent;
	 var as = {};
	 this.add = function(a) {
	     as[a.id()] = a;
	     return this;
	 };
	 this.addMany = function(as) {
	     var cur = this;
	     as.map(
		 function(a) {
		     cur.add(a);
		 });
	     return this;
	 };
	 this.lookup = function(id) {
	     if(as[id] != undefined) {
		 return as[id].scheme();
	     }
	     return parent.lookup(id);
	 };
	 this.createChild = function() {
	     return new typechecker.Assumps(this);
	 };
	 this.toString = function() {
	     var str = "";
	     as.map(
		 function(a) {
		     str += a.id() + "::" + a.scheme().toString()  + ",";
		 });
	     return str;
	 };
     };


     typechecker.NameGen = function() {
	 var curr = 0;
	 this.nextName = function() {
	     var ret = curr;
	     curr++;
	     return "a" + ret;
	 };
     };

     typechecker.Klass = function(supers, instances) {
	 this.supers = function() { return supers; };
	 this.instances = function() { return instances; };
     };

     typechecker.KlassEnvironment = function() {
	 var env = {};
	 this.lookup = function(id) {
	     if(this.defined(id)) {
		 return env[id];
	     }
	     throw "class not found";
	 };
	 this.modify = function(id, klass) {
	     env[id] = klass;
	     return this;
	 };
	 this.defined = function(id) {
	     return env[id] != undefined;
	 };
	 this.addClass = function(id, supers) {
	     var cur = this;
	     if(this.defined(id)) {
		 throw "class already defined";
	     }
	     supers.map(
		 function(s) {
		     if(!cur.defined(s)) {
			 throw "superclass not defined";
		     }
		 });
	     return this.modify(
		 id,
		 new typechecker.Klass(
		     supers,
		     []));
	 };
	 this.addInst = function(ps, p) {
	     if(!this.defined(p.id())) {
		 throw "no class for instance";
	     }
	     var qs = this.lookup(p.id()).instances().map(
		 function(inst) {
		     return inst.t();
		 });
	     qs.map(
		 function(q) {
		     if(p.overlap(q)) {
			 throw "overlapping instances";
		     }
		 });
	     return this.modify(
		 p.id(),
		 new typechecker.Klass(
		     this.lookup(p.id()).supers(),
		     this.lookup(p.id()).instances().concat(
			 [new typechecker.Qual(ps, p)])));   
		     
	 };
	 this.bySuper = function(pred) {
	     var cur = this;
	     return [pred].concat(
		 flatten(
		     this.lookup(pred.id()).supers().map(
			 function(id) {
			     return cur.bySuper(
				 new typechecker.Pred(
				     id,
				     pred.type()));
			 }
		     )));
	 };
	 this.byInst = function(pred) {
	     var ret = undefined;
	     this.lookup(pred.id()).instances.map(
		 function(qual) {
		     if(ret != undefined) {
			 return;
		     }
		     try {
			 var u = qual.t().matchPred(pred);
			 ret = qual.preds().map(
			     function(p) {
				 return p.apply(u);
			     });
		     } catch (x) {
			 return;
		     }
		 }
	     );
	     return ret;
	 };

	 this.entail = function(ps, p) {
	     var cur = this;
	     var a = any(
		 ps.map(
		     function(pp) {
			 return cur.bySuper(pp);
		     }),
		 function(pps) {
		     return any(
			 pps,
			 function(pp) {
			     return p.compare(pp);
			 });
		 });
	     var qs = this.byInst(p);
	     var b = qs == undefined
		 ? false
		 : all(
		     qs,
		     function(q) {
			 return cur.entail(ps,q);
		     });
	     return a || b;
	 };

	 this.toHnfs = function(ps) {
	     return flatten(
		 ps.map(
		     function(p) {
			 return this.toHnf(p);
		     }));
	 };

	 this.toHnf = function(p) {
	     if(p.inHnf()) {
		 return [p];
	     }
	     var ps = this.byInst(p);
	     if(ps == undefined) {
		 throw "context reduction";
	     }
	     return this.toHnfs(ps);
	 };

	 this.simplify = function(qs) {
	     var rs = [];
	     var ps = qs;
	     while(ps.length != 0) {
		 if(this.entail(
			rs.concat(ps.slice(1)),
			ps.slice(0,1))) {
		     ps = ps.slice(1);
		 } else {
		     rs = ps.slice(0,1).concat(rs);
		     ps = ps.slice(1);
		 }
	     }
	     return rs;
	 };

	 this.reduce = function(ps) {
	     return this.simplify(this.toHnfs(ps));
	 };

	 this.scEntail = function(ps, p) {
	     var cur = this;
	     return any(
		 ps.map(
		     function(pp) {
			 return cur.bySuper(pp);
		     }),
		 function(pps) {
		     return elem(pps, p);
		 });
	 };
     };

     typechecker.ambiguities = function(ce, vars, preds) {
	 return diff(preds.tv(), vars).map(
	     function(v) {
		 return {
		     type: v,
		     preds: filter(
			 ps,
			 function (vv) {
			     return elem(preds, vv);
			 })
		 };
	     });
     };

     typechecker.numClasses = ["Num", "Fractional", "Integral", "Float",
			       "Real", "RealFloat", "RealFrac"];

     typechecker.stdClasses = ["Eq", "Ord", "Show", "Read", "Bounded",
			       "Enum", "Ix", "Functor", "Monad",
			       "MonadPlus"].concat(typechecker.numClasses);

     typechecker.candidates = function(ce, ambig) {
	 return all(
	     ambig.preds,
	     function(p) {
		 return p.type().compare(ambig.type);
	     }) && any(
		 ambig.preds,
		 function(p) {
		     return elem(
			 typechecker.numClasses,
			 p.id());
		 }) && all(
		     ambig.preds,
		     function(p) {
			 return elem(
			     typechecker.stdClasses,
			     p.id());
		     }) ? filter(
			 ce.defaults(),
			 function(t) {
			     return all(
				 ambig.preds,
				 function(p) {
				     return ce.entail(
					 [],
					 new typechecker.Pred(
					     p.id(),
					     t));
				 }
			     );
			 }) :[]; 
     };
     
     typechecker.defaultPreds = function(ce, ts, ps) {
	 var ambigs = typechecker.ambiguities(ce, ts, ps);
	 var candidates = ts.map(
	     ambigs,
	     function(t) {
		 return typechecker.candidates(ce, t);
		 });
	 if(any(
		candidates,
		function(c) {
		    return c.length == 0;
		})) {
	     throw "cannot resolve ambiguity";
	 }
	 return flatten(
	     candidates.map(
		 function(ambig) {
		     return ambig.preds;
		 }
	     ));
     };

     typechecker.defaultSubst = function(ce, ts, ps) {
	 var ambigs = typechecker.ambiguities(ce, ts, ps);
	 var candidates = ts.map(
	     ambigs,
	     function(t) {
		 return typechecker.candidates(ce, t);
		 });
	 if(any(
		candidates,
		function(c) {
		    return c.length == 0;
		})) {
	     throw "cannot resolve ambiguity";
	 }
	 var subst = new typechecker.Subst();
	 for(var i in ts) {
	     subst.add(ts[i], ambigs[i].type);
	 }
	 return subst;
     };

     typechecker.Environment = function(assumps, subst, namegen) {
	 this.nextName = function() {
	     return namegen.nextName();
	 };
	 this.extSubst = function(otherSubst) {
	     subst = subst.compose(otherSubst);
	 };
	 this.getSubst = function() {
	     return subst;
	 };
	 this.unify = function(t1, t2) {
	     var s = this.getSubst();
	     var newSubst = t1.apply(
		 s
	     ).mgu(
		 t2.apply(s));
	     this.extSubst(newSubst);
	 };
	 this.newTVar = function(kind) {
	     return typechecker.newTVar(kind, namegen);
	 };
	 this.add = function(a) {
	     assumps.add(a);
	     return this;
	 };
	 this.addMany = function(as) {
	     return assumps.addMany(as);
	 };
	 this.lookup = function(id) {
	     return assumps.lookup(id);
	 };
	 this.createChild = function() {
	     return new typechecker.Environment(
		 assumps.createChild(),
		 subst,
		 namegen
	     );
	 };
     };

     typechecker.emptyEnv = function() {
	 return new typechecker.Environment(
	     new typechecker.Assumps(),
	     new typechecker.Subst(),
	     new typechecker.NameGen());
     };
 
}) (haskell.typechecker, haskell.ast);
