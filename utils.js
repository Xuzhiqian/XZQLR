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

var merge = function(a, b) {
		let flag = 0;
		for (let i in b)
			if (a[i] === undefined || a[i] === null) {
				a[i] = b[i];
				flag = 1;
			}
		return flag;
	};

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

var addToAction = function(a, x, y, v) {
		if (typeof a[x][y] !== 'object' || a[x][y] === undefined || a[x][y] === null)
			a[x][y] = [];
		a[x][y].push(v);
	}

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
var showTable = function(G, T) {
		let s = "<table id='ant' border=1 align='center'>";
		nTs = [];
		Ts = [];
		let symset = Object.keys(G.symset).sort();
		for (let index = symset.length-1; index>=0; index--) {
			let ss = symset[index];
			if (ss === 'ε') continue;
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

var drawGraph = function(C) {
	let s = 'digraph G {rankdir="LR" node[shape="box" fontname="Courier New"] edge[fontname="Courier New"] ';
	for (let state = 0; state < C.length; state++)
		s = s + ' I' + state + '[label="I' +state + ':\n' + listI(C[state]) +'"] ';

	for (let i = 0; i < C.length; i++)
		for (let j = 0; j < C.length; j++)
			if (C.goto[i]!==undefined && C.goto[i][j]!==undefined)
				s = s + 'I' + i + '->' + 'I' + j + ' [label="' + C.goto[i][j] + '"] ';
	s = s + '}';
	return s;
};


var listI = function(I) {
		let s = "";
			for (let nonT in I)
				for (let prod in I[nonT])
					for (let dot in I[nonT][prod]) {
						s = s + nonT + '->';
						for (let i = 0;i< parseInt(dot); i++)
							s = s + prod[i];
						s = s + '·';
						for (let i = parseInt(dot); i < prod.length; i++)
							s = s + prod[i];
						s = s + ', ';
						for (let ss in I[nonT][prod][dot])
							s = s + ss + '/';
						s = s.slice(0, s.length - 1) + '\n';
					}
		return s;
	};