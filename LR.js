var XZQLR = function() {
	var X = {};

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
			return null;	//grammar error
	};

	/*
		G : {
			main : 'S'',
			'S' : {
				'AB' : 1,
				'Bd' : 1
			},
			'A' : {
				'Aa' : 1,
				'e' : 1
			},
			FIRST : {
				'S' : {
					'a' : 1
				}
			}
		}
	*/
	X.extendGrammar = function(g) {
		var G = [];
		Object.defineProperty(G, "main", {
			value : g[0].nonT + '\'',
			enumerable : false
		});
		G[G.main] = [];
		G[G.main][g[0].nonT] = 1;
		Object.defineProperty(G, "symset", {
			value : {'$':1},
			enumerable : false
		});
		for (let index in g) {
			if (!G[g[index].nonT])
				G[g[index].nonT] = [];
			for (let aid in g[index].alts) {
				let p = g[index].alts[aid];
				if (p.indexOf('ε') >= 0 && p.length>1)
					while (p.indexOf('ε')>=0) p = p.replace("ε","");
				if (p.length <= 0) p = 'ε';
				G[g[index].nonT][p] = 1;
				for (let i = 0; i < p.length; i++)
					G.symset[p[i]] = 1;
			}
			G.symset[g[index].nonT] = 1;
		}
		Object.defineProperty(G, "FIRST", {
			value : [],
			enumerable : false
		});
		for (let nonT in G)
			G.FIRST[nonT] = [];

		let updated = [];
		for (let nonT in G) {
			let flag = 1;
			while (flag) {
				flag = merge(G.FIRST[nonT], X.FIRST(G, nonT, [], updated));
				if (updated[nonT]) {
					flag = 1;
					updated[nonT] = 0;
				}
			}
		}
		return G;
	};

	X.FIRST = function(G, s, visited, updated) {
		let F = [];
		let t;
		let isε = true;
		for (let i = 0; i < s.length; i+=t.length) {
			if (s.indexOf(G.main) === i)
				t = G.main;
			else
				t = s[i];

			let f = [];
			if (G[t]) {
				if (visited && !visited[t]) {
					visited[t] = 1;
					for (let prod in G[t])
						merge(f, X.FIRST(G, prod, visited, updated));
					if (merge(G.FIRST[t], f))
						if (updated && !updated[t])
							updated[t] = 1;
				}
				else
					merge(f, G.FIRST[t])
			}
			else
				f[t] = 1;
			merge(F, f);
			if (!f['ε']) {
				isε = false;
				break;
			}
		}
		if (!isε)
			delete F['ε'];
		return F;
	};

	/*
		I : {
			'S'' : {
				'S' : {
					0 : {
						'$' : 1
					}
				}
			},
			'S' : {
				'BB' : {
					0 : {
						'$' : 1
					}
				}
			},
			'B' : {
				'bB' : {
					0 : {
						'a' : 1,
						'b' : 1
					}
				},
				'a' : {
					0 : {
						'a' : 1,
						'b' : 1
					}
				}
			}
		}
	*/
	
	X.closure = function(G, I) {
		let flag = 1;
		while (flag) {
			flag = 0;
			for (let nonT in I)
				for (let prod in I[nonT])
					for (let dot in I[nonT][prod])
						for (let s in I[nonT][prod][dot]) {
							B = prod[parseInt(dot)];
							for (let y in G[B]) {
								bs = X.FIRST(G, prod.slice(parseInt(dot) + 1) + s);
								let _dot = '0';
								if (y === 'ε') _dot = '1';
								for (let b in bs)
									if (addToI(I, B, y, _dot, b))
										flag = 1;
							}
						}
		}
		return I;
	};
	X.goto = function(G, I, x) {
		let J = {};
		for (let nonT in I)
				for (let prod in I[nonT])
					for (let dot in I[nonT][prod])
						if (prod[parseInt(dot)] === x)
							for (let s in I[nonT][prod][dot])
								addToI(J, nonT, prod, parseInt(dot) + 1, s);
		return X.closure(G, J);
	};
	X.items = function(G) {
		let I = {};
		I[G.main] = {};
		for (var p in G[G.main])
			I[G.main][p] = {};
		I[G.main][p]['0'] = {'$' : 1};
		let C = [];
		C.push(X.closure(G, I));
		Object.defineProperty(C, stringify(C[0]), {
			value : 0,
			enumerable : false
		});
		Object.defineProperty(C, 'goto', {
			value : [],
			enumerable : false
		});

		let flag = 1;
		while (flag) {
			flag = 0;
			for (let Iindex in C) {
				let I = C[Iindex];
				for (let x in G.symset) {
					let IX = X.goto(G, I, x);
					let str = stringify(IX);
					let index = C[str];
					if (str !== '{}' && index === undefined) {
						index = C.push(IX) - 1;
						Object.defineProperty(C, str, {
							value : index,
							enumerable : false
						});	
						flag = 1;
					}
					addToI(C.goto, Iindex, index);
					C.goto[Iindex][index] = x;
				}
			}
		}
		return C;
	};

	X.buildTable = function(G, C) {
		let action = [];
		let _goto = [];
		for (let i = 0; i < C.length; i++) {
			action[i] = [];
			_goto[i] = [];
			for (let j = 0; j < C.length; j++)
				if (C.goto[i][j])
					if (!G[C.goto[i][j]])
						addToAction(action, i, C.goto[i][j], 's' + j);
					else
						addToAction(_goto, i, C.goto[i][j], j);
		}
		for (let i = 0; i < C.length; i++) {
			I = C[i];
			for (let nonT in I)
				for (let prod in I[nonT])
					for (let dot in I[nonT][prod])
						if (parseInt(dot) === prod.length) {
							if (nonT === G.main && prod.length === 1)
								addToAction(action, i, '$', 'acc');
							else
								for (let s in I[nonT][prod][dot])
									addToAction(action, i, s, 'r(' + nonT + '->' + prod + ')');
								addToAction(action, i, 'ε', 'r(' + nonT + '->' + prod + ')');
						}
		}
		return {
			'action' : action,
			'goto' : _goto,
			'num_state' : C.length
		};
	};

	return X;
}