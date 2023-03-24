import { of, atom, autorun } from "./atom.mjs";

const a = of(1);
const b = of(2);
const c = atom([a, b], (a, b) => a + b);
const d = atom([a, c], (a, c) => a * c);

autorun(() => console.log(`A = ${a.get()}`));
autorun(() => console.log(`B = ${b.get()}`));
autorun(() => console.log(`C = ${c.get()}`));
autorun(() => console.log(`D = ${d.get()}`));
console.log(" ");
a.next(3);
console.log(" ");
a.next(4);
console.log(" ");
a.next(5);
console.log(" ");
b.next(10);
