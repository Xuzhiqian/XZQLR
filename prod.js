var XZQLR = function() {
	var X = {};

	var reg_prod =/^[A-Za-z]->[^\|]+(\|[^\|]+)*$/;
	var match_nonTerminal = function(s) {
		if (s[0].match(/[A-Za-z]/))
			return [s[0],s.slice(1)];
	}
	var match = function(s, m) {
		let l = s.indexOf(m);
		if (l === 0)
			return s.slice(m.length);
		else
			return s;
	}
	var match_prod = function(s) {
		let r = s.match(/^[^\|]+/);
		if (r)
			return [r[0], s.slice(r[0].length)];
	}
	X.stringToProd = function(s) {
		if (s.match(reg_prod)) {
			var p = {
				alts : []
			};
			[p.nonT, s] = match_nonTerminal(s);
			s = match(s, "->");
			while (s.length > 0) {
				[p.alts[p.alts.length], s] = match_prod(s);
				s = match(s, "|");
			}
			return p;
		}
		else
			return null;
	};

	X.copyProd = function(_p) {
		var p = {
			alts : [],
			nonT : _p.nonT
		};
		for (let alt in _p.alts)
			p.alts.push(alt);
		return p;
	}

	X.extendGrammar = function(g) {
		var G = {};
		G.main = X.stringToProd(g[0].nonT + '\'->' + g[0].nonT);
		G.prods = [];
		for (let prod in g)
	}

	return X;
}
X = XZQLR();