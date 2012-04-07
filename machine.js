function dcpu() {
	"use strict";
	var reg_names = ['A', 'B', 'C', 'X', 'Y', 'Z', 'I', 'J', 'PC', 'SP', 'O'];
	var basicInstrNames = [undefined, "SET", "ADD", "SUB", "MUL", "DIV", "MOD", "SHL", "SHR", "AND", "BOR", "XOR", "IFE", "IFN", "IFG", "IFB"];
	var basicInstrDelays = [       0,     1,     2,     2,     2,     3,     3,     2,     2,     1,     1,     1,     2,     2,     2,     2];
	var nonBasicInstrNames = [undefined, "JSR"];
	var nonBasicInstrDelays = [       0,     2];

	var oldPC = -1;
	var time = 0;

	var cpu = {};
	cpu.mem = new Array(0x10000);
	resetRegisters();

	function resetRegisters() {
		cpu.SP = 0;
		cpu.PC = 0;
		cpu.O = 0;

		cpu.A = 0;
		cpu.B = 0;
		cpu.C = 0;
		cpu.X = 0;
		cpu.Y = 0;
		cpu.Z = 0;
		cpu.I = 0;
		cpu.J = 0;
	}
	
	function setMemory(str) {
		var tmp = 0;
		var ptr = 0;
		var i = 0;

		/*remove 1234: or 0xbeef: from the beginning*/
		str = str.split(/^(?:0x)?[0-9a-fA-F]{1,4}:/m).join("");

		while(i < str.length) {
			var j = 0;
			while(i < str.length && j < 4) {
				var c = str[i++];
				if('0' <= c && c <= '9') {
					c = c.charCodeAt() - '0'.charCodeAt();
				} else if('A' <= c && c <= 'F') {
					c = c.charCodeAt() - 'A'.charCodeAt() + 10;
				} else if('a' <= c && c <= 'f') {
					c = c.charCodeAt() - 'a'.charCodeAt() + 10;
				} else {
					continue;
				}

				tmp += c * Math.pow(16, 3 - j);
				j++;
			}
			cpu.mem[ptr++] = tmp;
			tmp = 0;
		}
		var written = ptr;
		while(ptr < cpu.mem.length) {
			cpu.mem[ptr++] = 0;
		}
		return written;
	}

	this.initMachine = function(memDump) {
		resetRegisters();
		var written = setMemory(memDump);
		oldPC = -1;
		time = 0;
		return written;
	}

	this.dumpMemory = function(from, to) {
		var mem = [];
		for(var i = from; i < to; i++) {
			var word = cpu.mem[i];
			mem[i - from] = word;
		}
		return mem;
	}

	this.dumpRegisters = function() {
		var regs = [];
		for(var i = 0; i < reg_names.length; i++) {
			regs[i] = {name: reg_names[i], value: cpu[reg_names[i]]};
		}
		return regs;
	}

	this.parseInstruction = parseInstr;

	function parseInstr(begin) {
		var pc = begin >= 0 ? begin : cpu.PC;
		var instr = {pc: pc};
		var word = cpu.mem[pc++];
		var o = word & 0xf;
		var a, b;
		if(o > 0) {
			a = (word & 0x3f0) >> 4;
			b = (word & 0xfc00) >> 10;
			instr.a = getAddress(a); /*important: a before b!*/
			instr.b = getAddress(b);
			instr.op = o;
			instr.basic = basicInstrNames[o];
			instr.delay = basicInstrDelays[o] + (instr.a.nextWord ? 1 : 0) + (instr.b.nextWord ? 1 : 0);
		} else {
			o = (word & 0x3f0) >> 4;
			a = (word & 0xfc00) >> 10;
			instr.a = getAddress(a);
			instr.op = 0;
			instr.nonBasicOP = o;
			instr.nonBasic = nonBasicInstrNames[o];
			instr.delay = nonBasicInstrDelays[o] + (instr.a.nextWord ? 1 : 0);
		}
		instr.size = pc - instr.pc;

		return instr;

		function getAddress(code) {
			var addr = {};
			if(code <= 0x17) {
				switch(code & 0x07) {
					case 0:	addr.reg = "A"; break;
					case 1: addr.reg = "B"; break;
					case 2: addr.reg = "C"; break;
					case 3: addr.reg = "X"; break;
					case 4: addr.reg = "Y"; break;
					case 5: addr.reg = "Z"; break;
					case 6: addr.reg = "I"; break;
					case 7: addr.reg = "J"; break;
				}
				if(code >= 0x10) {
					var nextWord = cpu.mem[pc++];
					addr.offset = nextWord;
					addr.nextWord = true;
				}
				if(code >= 0x08) {
					addr.indirection = true;
					addr.addr = cpu[addr.reg] + addr.offset || 0;
				}
			} else if(code <= 0x1f) {
				switch(code) {
					case 0x18: {
						addr.stack = "POP";
						addr.addr = cpu.SP;
					}
					break;

					case 0x19: {
						addr.stack = "PEEK";
						addr.addr = cpu.SP; 
					}
					break;

					case 0x1a: {
						addr.stack = "PUSH";
						addr.addr = cpu.SP - 1;
					}
					break;

					case 0x1b: {
						addr.reg = "SP";
					}
					break;

					case 0x1c: {
						addr.reg = "PC";
					}
					break;

					case 0x1d: {
						addr.reg = "O";
					}
					break;

					case 0x1e: {
						var nextWord = cpu.mem[pc++];
						addr.addr = nextWord;
						addr.indirection = true;
						addr.nextWord = true;
					}
					break;

					case 0x1f: {
						addr.lit = cpu.mem[pc++]
						addr.nextWord = true;
					}
				}
			} else if(code <= 0x3f) {
				addr.lit = code - 0x20;
				addr.small = true;
			} else {
				console.log("error: getAddress for code 0x" + code.toString(16));
			}

			addr.get = function() {
				if(addr.value >= 0) {
					return addr.value;
				}
				if(addr.addr) {
					addr.value = cpu.mem[addr.addr];
				} else if(addr.reg) {
					addr.value = cpu[addr.reg];
				} else if(addr.lit >= 0) {
					addr.value = addr.lit;
				} else {
					console.log("error: setValue for address:");
					console.log(addr);
				}
				return addr.value;
			}

			addr.set =function(value) {
				if(addr.addr) {
					cpu.mem[addr.addr] = value;
				} else if(addr.reg) {
					cpu[addr.reg] = value;
				} else if(addr.lit >= 0) {
					/*fail silently*/
				} else {
					console.log("error: setValue for address:");
					console.log(addr);
				}
			}

			return addr;
		}
	}

	function execute(instr) {
		oldPC = cpu.PC;
		cpu.PC = (cpu.PC + 1) & 0xffff;
		time += instr.delay;

		var op = instr.op;
		var a =	instr.a;
		var b = instr.b;

		function sideEffects(addr) {
			if(addr.nextWord) {
				cpu.PC = (cpu.PC + 1) & 0xffff;
			} else if(addr.stack === "POP") {
				cpu.PC = (cpu.PC + 0xffff) & 0xffff;
			} else if(addr.stack === "PUSH") {
				cpu.PC = (cpu.PC + 0xffff) & 0xffff;
			}
		}
		sideEffects(a);
		if(b) {
			sideEffects(b);
		}

		var tmp;

		if(op > 0) {
			switch(op) {
				case 0x1: a.set(b.get()); /*SET*/
				break;

				case 0x2: { /*ADD*/
					tmp = a.get() + b.get();
					if(tmp > 0xffff) {
						a.set(tmp - 0x10000);
						cpu.O = 1;
					} else {
						a.set(tmp);
						cpu.O = 0;
					}
				}
				break;

				case 0x3: { /*SUB*/
					tmp = a.get() - b.get();
					if(tmp < 0) {
						a.set(tmp + 0x10000);
						cpu.O = 0xffff;
					} else {
						a.set(tmp);
						cpu.O = 0;
					}
				}
				break;

				case 0x4: { /*MUL*/
					tmp = a.get() * b.get();
					a.set(tmp & 0xffff);
					cpu.O =(tmp >> 16) & 0xffff;
				}
				break;

				case 0x5: { /*DIV*/
					if(b === 0) {
						a.set(0);
						cpu.O = 0;
					} else {
						a.set(Math.floor (a.get() / b.get()) & 0xffff);
						cpu.O = Math.floor((a.get() << 16) / b.get()) & 0xffff;
					}
				}
				break;

				case 0x6: { /*MOD*/
					if(b === 0) {
						a.set(0);
					} else {
						a.set(a.get() % b.get());
					}
				}
				break;

				case 0x7: { /*SHL*/
					tmp = a.get() << b.get();
					a.set(tmp);
					cpu.O =(tmp >> 16) & 0xffff;
				}
				break;

				case 0x8: { /*SHR*/
					a.set(a.get() >> b.get());
					cpu.O =((a.get() << 16) >> b.get()) & 0xffff;
				}
				break;

				case 0x9: a.set(a.get() & b.get()) /*AND*/
				break;

				case 0xa: a.set(a.get() | b.get()) /*BOR(binary or)*/
				break;

				case 0xb: a.set(a.get() ^ b.get()) /*XOR*/
				break;

				case 0xc: { /*IFE(skip if not equal)*/
					if(a.get() !== b.get()) {
						tmp = parseInstr(); /*skip instruction*/
						cpu.PC += tmp.size;
						time++;
					}
				}
				break;

				case 0xd: { /*IFN(skip if equal)*/
					if(a.get() === b.get()) {
						tmp = parseInstr(); /*skip instruction*/
						cpu.PC += tmp.size;
						time++;
					}
				}
				break;

				case 0xe: { /*IFG(skip if less or equal)*/
					if(a.get() <= b.get()) {
						tmp = parseInstr(); /*skip instruction*/
						cpu.PC += tmp.size;
						time++;
					}
				}
				break;

				case 0xf: { /*IFB*/
					if((a.get() & b.get()) == 0) {
						tmp = parseInstr(); /*skip instruction*/
						cpu.PC += tmp.size;
						time++;
					}
				}
				break;
			}
		} else {
			switch(instr.nonBasicOP) {
				case 0x101: { /*JSR(jump stack return-address)*/
					cpu.SP = (cpu.SP + 0xffff) & 0xffff;
					cpu.mem[cpu.SP] = cpu.PC;
					cpu.PC = a.get();
				}
				break;
			}
		}
	}

	this.simulate = function(count) {
		var instrs = [];
		while(cpu.PC !== oldPC && count-- > 0) {
			var tmp = parseInstr(cpu.PC);
			if(!tmp.basic && !tmp.nonBasic) {
				return instrs;
			}
			tmp.started = time;
			instrs.push(tmp);
			execute(tmp);
		}
		return instrs;
	}
}
