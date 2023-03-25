import { of, atom, autorun } from "./atom.mjs";

const name = of("John", "name");
const surname = of("Smith", "surname");
const full_name = atom([name, surname], (a, b) => `${a} ${b}`, "full_name");
const age = of(21, "age");

autorun(() => {
  console.log(full_name.get());
  if (full_name.get() === "Mike Rose") {
    console.log(age.get());
  }
  console.log("");
});
name.next("Mike");
surname.next("Rose");
age.next(42);
age.next(43);
