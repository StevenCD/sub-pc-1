var input = document.getElementById ("input");

var machine = new dcpu();
machine.initMachine("");
var written = 10;

document.getElementById ("start").addEventListener ("click", function () {
	var input = document.getElementById ("input").value;
	written = machine.initMachine(input);
	var timeout = document.getElementById("delay");

	instructions = [];
	simulate (timeout);
});	

document.getElementById("code").innerHTML = instructionTable(disassemble(0, 10));
document.getElementById("videoram").innerHTML = memoryTable(0x8000, 0x8080, 16, String.fromCharCode);
document.getElementById("registers").innerHTML = registerTable();

var instructions = [];

function simulate(timeout) {
	var instrs = machine.simulate(1);
	if(instrs[0]) {
		instructions.push (instrs[0]);
	}

	document.getElementById("code").innerHTML = instructionTable(disassemble(0, written || 10), createFocusMap(instructions, 2));
	document.getElementById("videoram").innerHTML = memoryTable(0x8000, 0x8080, 16, String.fromCharCode);
	document.getElementById("registers").innerHTML = registerTable();

	if(instrs.length > 0) {
		var wait = timeout.value;
		wait = !(wait >= 0) ? 1000 : wait;
		setTimeout(function () {
			simulate(timeout);
		}, wait);
	}
}

function createFocusMap (instrs, count) {
	var focus = {};
	for(var i = 1; i <= count && instrs.length - i >= 0; i++) {
		focus[instrs[instrs.length - i].pc] = i;
	}
	return focus;
}

function makeTable(data, header, focus, cssClass) {
	var table = "<table";
	if(cssClass) {
		table += " class=" + cssClass;
	}
	table += ">\n";
	focus = focus || {};
	if(header) {
		table += "\t<tr>";
		for(var i = 0; i < header.length; i++) {
			table += "<th>" + header[i] + "</th>";
		}
		table += "</tr>\n";
	}
	for(var i = 0; i < data.length; i++) {
		var row = "\t<tr class=";
		if(focus[i.toString()]) {
			row += "focus" + focus[i];
		} else if(i % 2 === 0) {
			row += "even";
		} else {
			row += "odd";
		}
		row += ">";
		for(var j = 0; j < data[i].length; j++) {
			row += "<td>" + data[i][j] + "</td>";
		}
		table += row + "</tr>\n";
	}
	return table + "</table>\n";
}

function registerTable() {
	var regs = machine.dumpRegisters();
	var header = [];
	var values = [];
	for(var i = 0; i < regs.length; i++) {
		header.push(regs[i].name);
		values.push(regs[i].value.toString(16));
	}
	return makeTable([values], header, null, "regTable");
}

function memoryTable(from, to, cols, formatter) {
	cols = cols || 8;
	formatter = formatter || function(val) {return val.toString(16)};
	var mem = machine.dumpMemory(from, to);
	var table = [];

	for(var i = 0; i < mem.length;) {
		var row = [(from + i).toString(16)];
		for(var j = 0; i + j < mem.length && j < cols; j++) {
			row.push(formatter(mem[i + j]));
		}
		for(;j < cols; j++) {
			row.push("");
		}
		i += j;
		table.push(row);
	}
	return makeTable(table, null);
}

function disassemble(from, to) {
	var mem = machine.dumpMemory (from, to);
	var instrs = [];
	for(var i = 0; i < mem.length;) {
		var tmp = machine.parseInstruction(i);
		i += tmp.size;
		instrs.push(tmp);
	}
	return instrs;
}

function instructionTable(instructions, focus) {
	function toRow(instr) {
		var row = [toHex(instr.pc) + ":", instr.basic || instr.nonBasic]
		row.push(printValue(instr.a));
		if(instr.b) {
			row.push(", " + printValue(instr.b));
		} else {
			row.push("");
		}
		var mem = machine.dumpMemory(instr.pc, instr.pc + instr.size);
		mem = mem.map(function(val){return toHex(val)});
		row.push("\t;" + mem.join(" "));
		return row;
	}

	function printValue(val) {
		var str = val.reg || val.stack || toHex(val.addr) || toHex(val.lit);
		if(val.offset) {
			str = "0x" + val.offset + "+" + str;
		}
		if(val.indirection) {
			str = "[" + str + "]";
		}
		return str;
	}

	var highlights = {};
	focus = focus || {};
	var table = [];
	for(var i = 0; i < instructions.length; i++) {
		var tmp = instructions[i];
		table.push(toRow(tmp));

		if(focus[tmp.pc]) {
			highlights[i] = focus[tmp.pc];
		}
	}
	return makeTable(table, null, highlights);
}

function toHex(word) {
	if(!(0 <= word && word <= 0xffff)) {
		return word;
	}
	var hex = word.toString(16);
	while(hex.length < 4) {
		hex = "0" + hex;
	}
	return hex;
}

//7c01 00307de1 1000 00207803 1000c00d 7dc1 001aa8617c01 10002161 10008463806d7dc1 000d 9031 7c10 0018 7dc1 001a 9037 61c1 7dc1 001a


//console.log (dumpMem (0, written + 3));


//console.log (dumpMem (0x8000, 0x8010));
//console.log (dumpRegs ());
/*
generated with: http://mappum.github.com/DCPU-16/

SET [0x8000], 72
SET [0x8001], 101
SET [0x8002], 108
SET [0x8003], 108
SET [0x8004], 111
SET [0x8005], 44
SET [0x8006], 32
SET [0x8007], 119
SET [0x8008], 111
SET [0x8009], 114
SET [0x800a], 108
SET [0x800b], 100
SET [0x800c], 33
SUB PC, 1

0000: 7de1 8000 0048 7de1 8001 0065 7de1 8002
0008: 006c 7de1 8003 006c 7de1 8004 006f 7de1
0010: 8005 002c 7de1 8006 0020 7de1 8007 0077
0018: 7de1 8008 006f 7de1 8009 0072 7de1 800a
0020: 006c 7de1 800b 0064 7de1 800c 0021 85c3
0028: 006f 7df1 8005 002c 7df1 8006 0020 7df1
0030: 8007 0077 7df1 8008 006f 7df1 8009 0072
0038: 7df1 800a 006c 7df1 800b 0064 7df1 800c
0040: 0021 0020 7dc1 0042 0000 0000 0000 0000
*/