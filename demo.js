class Hooks {
  constructor() {
    this.listener = {};
  }

  on(eventName, handler) {
    if (!this.listener[eventName]) {
      this.listener[eventName] = [];
    }
    this.listener[eventName].push(handler);
  }

  trigger(eventName, ...args) {
    const handlers = this.listener[eventName];
    const results = [];
    if (handlers) {
      for (const handler of handlers) {
        const result = handler(...args);
        results.push(result);
      }
    }
    return results;
  }

  off(eventName, handler) {
    const handlers = this.listener[eventName];
    if (handlers) {
      this.listener[eventName] = handlers.filter(cb => cb !== handler);
    }
  }

  destroy() {
    this.listener = {};
  }
}

class Calculator {
  constructor(options = {}) {
      this.hooks = new Hooks();
      const { initialValue = 0, plugins = [] } = options
      this.currentValue = initialValue;
      plugins.forEach(plugin => plugin.apply(this.hooks));
  }
  getCurrentValue() {
      return this.currentValue;
  }
  setValue(value) {
    const result = this.hooks.trigger('valueWillChanged', value);
    if (result.length !== 0 && result.some(_ => !_)) {
    } else {
      this.currentValue = value;
    }
    this.hooks.trigger('valueChanged', this.currentValue);
  }
  plus(addend) {
      this.hooks.trigger('pressedPlus', this.currentValue, addend);
      this.setValue(this.currentValue + addend);
  }
  minus(subtrahend) {
      this.hooks.trigger('pressedMinus', this.currentValue, subtrahend);
      this.setValue(this.currentValue - subtrahend);
  }

  press(buttonName, newVal) {
    const callbacks = this.hooks.trigger('pressed', buttonName);
    
    // 为什么下面是for循环？
    // 因为hooks的pressed对应的事件处理器可能不止有一个。
        // 比如两个插件，都监听处理了pressed事件，那么返回的结果（callbacks）也就不只一个。
        // 最后在calculator.press('squared')时，两个插件的pressed处理器都执行了。
    for (const callback of callbacks) {
      if (callback) {
        this.setValue(callback(this.currentValue, newVal));
      }
    }
  }
}


class MoreOperatorPlugins {
  apply(hooks) {
    hooks.on('pressed', (buttonName) => {
      switch (buttonName) {
        case 'squared':
          return (currentVal) => currentVal*currentVal
        case 'multiply':
          return (currentVal, newVal) => currentVal*newVal
        default:
          return;
      }
    });
  }
}
class MoreOperatorPlugins1 {
  apply(hooks) {
    hooks.on('pressed', (buttonName) => {
      switch (buttonName) {
        case 'squared':
          return (currentVal) => currentVal*currentVal
        default:
          return;
      }
    });
  }
}

class LogPlugins {
  apply(hooks) {
    hooks.on('pressedPlus', (currentVal, addend) => console.log(`${currentVal} + ${addend}`));
    hooks.on('pressedMinus', (currentVal, subtrahend) => console.log(`${currentVal} - ${subtrahend}`));
    hooks.on('valueChanged', (currentVal) => console.log(`结果： ${currentVal}`));
  }
}

class LimitPlugins {
  apply(hooks) {
    hooks.on('valueWillChanged', (newVal) => {
      if (2000 < newVal) {
        console.log('result is too large')
        return false;
      }
      return true
    });
  }
}

// run test
const calculator = new Calculator({
  plugins: [new LogPlugins(), new LimitPlugins(), new MoreOperatorPlugins(), new MoreOperatorPlugins1()],
});
calculator.plus(10);
calculator.minus(5);
calculator.plus(2000);
calculator.press('squared');
calculator.press('multiply', 2);
