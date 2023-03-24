const observers = new Set();

const notify = (a) => {
  observers.forEach((observer) => {
    if (runMap.get(observer)?.has(a)) {
      observer();
    }
  });
};

const runMap = new Map();

let currentObserver = null;

// The autorun function accepts one function that should run every time anything it observes changes.
// It also runs once when you create the autorun itself.
// Returns a disposer function that you need to call in order to cancel it.
export const autorun = (observer) => {
  runMap.set(observer, new Set());
  currentObserver = observer;
  observer();
  currentObserver = null;
  observers.add(observer);
  return () => {
    runMap.delete(observer);
    observers.delete(observer);
  };
};

const STATUS = {
  OUTDATED: 1,
  COMPUTING: 2,
  ACTUAL: 3,
};

export const atom = (depends, fn, name) => {
  const connect = () => {
    // сообщаем атомам, от которых мы зависим,
    // что мы теперь от них зависим
    self.depends.forEach((atom) => atom.subscribe(self));
  };

  const self = {
    name,
    depends, // список зависимостей
    fn, // функция для расчёта значения
    subscribers: [], // кто зависит от нас
    cache: undefined, // вычисленное значение будет храниться в кэше
    status: STATUS.OUTDATED, // актуальность вычисленного значения
    get: () => {
      if (self.status === STATUS.COMPUTING) {
        throw new Error("Logic error: circle dependencies");
      }
      runMap.get(currentObserver)?.add(self);
      if (self.status !== STATUS.ACTUAL) {
        self.status = STATUS.COMPUTING;
        self.cache = self.fn(...self.depends.map((atom) => atom.get()));
        self.status = STATUS.ACTUAL;
      }
      return self.cache;
    },
    set: (depends, fn) => {
      // удалям себя из списка зависимостей у тех, от кого мы зависим сейчас
      self.depends.forEach((atom) => atom.disconnect(self));
      self.depends = depends; // заменяем список зависимостей
      self.fn = fn; // и функцию для расчёта значения
      // помечаем значение как неактуальное,
      // актуальное значение будет вычислено позже по запросу
      self.outdated();
      connect(); // сообщаем новым зависимостям, что мы теперь от них зависим
      notify(self); // сообщаем внешним подписчикам, что есть изменения
    },
    next: (x) => {
      self.set(self.depends, () => x);
    },
    outdated: () => {
      self.status = STATUS.OUTDATED; // помечаем текущее значение как неактуальное
      // сообщаем всем, кто зависит от нас, что у них значение теперь тоже неактуальное
      self.subscribers.forEach((atom) => atom.outdated());
    },
    subscribe: (atom) => self.subscribers.push(atom), // какой-то атом говорит, что зависит от нас
    disconnect: (atom) => {
      // какой-то атом говорит, что больше не зависит от нас
      const index = self.subscribers.indexOf(atom);
      if (index !== -1) self.subscribers.splice(index, 1);
    },
  };

  connect();

  return self;
};

// fmap :: (a -> b) -> m a -> m b
export const fmap = (f) => (ma) => atom([ma], f);

// chain :: (a -> m b) -> m a -> m b
export const chain = (f) => fmap((a) => f(a).get());

// of :: a -> m a
export const of = (a, name) => atom([], () => a, name);

// Lifts a function that works on normal values to work on atoms.
export const lift = (f) => {
  return (...depends) => atom(depends, f);
};
