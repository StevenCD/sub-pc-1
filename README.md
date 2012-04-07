#### disclaimer ####
Hi,
this is my first time on github.

So I have chosen this project to get my hands dirty and learn something I should have learned years ago...


# SUB PC, 1 - Yet another DCPU16 Emulator #
The specification can be found [here](http://0x10c.com/doc/dcpu-16.txt).

Everything else should be [there](http://0x10c.com).

My work so far is [this](http://stevencd.github.com/sub-pc-1).

## Features ##
* **NO ASSEMBLER** works only with bytecode (next on the TODO list)
* written in JavaScript
* video-RAM, disassembler, program counter highlighting
* don't know much about CSS, but tried none the less

## Input Format ##

    0000: 7de1 8000 0048 7de1 8001 0065 7de1 8002
    0008: 006c 7de1 8003 006c 7de1 8004 006f 7de1
    0010: 8005 002c 7de1 8006 0020 7de1 8007 0077
    0018: 7de1 8008 006f 7de1 8009 0072 7de1 800a
    0020: 006c 7de1 800b 0064 7de1 800c 0021


Afaik, this is what most dcpu16 Assemblers will output.
The [0-9a-fA-F]{1,4}: at the beginning of the lines will be ignored and is optional.

## If you like the Idea of a dcpu16 emulator in JS... ##
... you should watch [https://github.com/mappum/DCPU-16](https://github.com/mappum/DCPU-16).
The above code was generated with the linked assembler.

I am just here to have fun programming and to learn about github.
**If you want to help with the development of an emulator/assember/dcpu-compiler you should consider these projects [https://github.com/dcpu16](https://github.com/dcpu16) or the ones linked here [http://news.ycombinator.com/item?id=3803163](http://news.ycombinator.com/item?id=3803163).**

I am perfectly happy tinkering here on my own (for now).