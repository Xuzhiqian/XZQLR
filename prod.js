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

	var merge = function(a, b) {
		let flag = 0;
		for (let i in b)
			if (a[i] === undefined || a[i] === null) {
				a[i] = b[i];
				flag = 1;
			}
		return flag;
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
	var stringify = function(S) {
		if (typeof S !== 'object')
			return S;
		let s = "{";
		let keys = Object.keys(S).sort();
		for (let i = 0; i < keys.length; i++)
			s = s + keys[i] + ':' + stringify(S[keys[i]]);
		return s + '}';
	};
	var addToI = function() {
		let I = arguments[0];
		let flag = 0;
		for (let i = 1; i<arguments.length - 1; i++) {
			if (typeof I[arguments[i]] !== 'object' || I[arguments[i]] === undefined || I[arguments[i]] === null) {
				I[arguments[i]] = {};
				flag = 1;
			}
			I = I[arguments[i]];
		}
		let p = arguments[arguments.length - 1];
		if (I[p] !== 1) {
			flag = 1;
			I[p] = 1;
		}
		return flag;
	};
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

	var addToAction = function(a, x, y, v) {
		if (typeof a[x][y] !== 'object' || a[x][y] === undefined || a[x][y] === null)
			a[x][y] = [];
		a[x][y].push(v);
	}
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
	var addRow = function() {
		let s = "";
		for (let i = 0; i < arguments.length; i++)
			if (arguments[i]!==undefined) 
				if (typeof arguments[i] === 'object') {
					s = s + "<td>";
					for (let j = 0; j < arguments[i].length; j++)
						if (arguments[i][j]!==undefined)
							s = s + arguments[i][j] + "<br>";
					s = s + "</td>";
				}
				else
					s = s + "<td>" + arguments[i] + "</td>";
			else
				s = s + "<td></td>";
		return s;
	};
	X.showTable = function(G, T) {
		let s = "<table id='ant' border=1>";
		nTs = [];
		Ts = [];
		let symset = Object.keys(G.symset).sort();

		for (let index = symset.length-1; index>=0; index--) {
			let ss = symset[index];
			//if (ss === 'ε') continue;
			if (G[ss]!==undefined)
				nTs.push(ss); 
			else
				Ts.push(ss);
		}
		s = s + "<tr><td rowspan=2>状态</td><td colspan=" + Ts.length + ">动作</td><td colspan=" + nTs.length + ">转移</td></tr>";
		
		for (let i = 0; i< Ts.length; i++)
			s = s + addRow(Ts[i]);
		for (let i = 0; i< nTs.length; i++)
			s = s + addRow(nTs[i]);

		for (let state = 0; state < T.num_state; state++) {
			s = s + '<tr>' + addRow(state);
			for (let i = 0; i < Ts.length; i++)
				s = s + addRow(T.action[state][Ts[i]]);
			for (let i = 0; i < nTs.length; i++)
				s = s + addRow(T.goto[state][nTs[i]]);
			s = s + "</tr>";
		}
		return s;
	};

	X.listI = function(C) {
		let s = "";
		for (let i = 0; i < C.length; i++) {
			s = s + "I" + i + " : \n";
			for (let nonT in C[i])
				for (let prod in C[i][nonT])
					for (let dot in C[i][nonT][prod]) {
						s = s + nonT + ' -> ';
						for (let i = 0;i< parseInt(dot); i++)
							s = s + prod[i];
						s = s + '·';
						for (let i = parseInt(dot); i < prod.length; i++)
							s = s + prod[i];
						s = s + ' , ';
						for (let ss in C[i][nonT][prod][dot])
							s = s + ss + '/';
						s = s.slice(0, s.length - 1) + '\n';
					}
			s = s + '\n';

		}
		return s;
	};
	return X;
}

X = XZQLR();
s = ['S->AB',
	 'A->aAb|ε',
	 'B->Bb|b'];
g=[];
for (let index in s)
	g.push(X.stringToProd(s[index]));
G=X.extendGrammar(g);
C=X.items(G);
T = X.buildTable(G, C);
console.log(T);
console.log(X.listI(C));
document.getElementById("lrtable").innerHTML = X.showTable(G, T)