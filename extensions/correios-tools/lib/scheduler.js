const tasks = new Map();

export const Scheduler = {
  register(name, cronExpression, callback) {
    const parsed = this.parseExpression(cronExpression);
    if (!parsed) return false;

    tasks.set(name, {
      expression: cronExpression,
      parsed,
      callback,
      lastRun: null,
    });

    return true;
  },

  unregister(name) {
    return tasks.delete(name);
  },

  parseExpression(expression) {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return null;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    return {
      minute: this.parseField(minute, 0, 59),
      hour: this.parseField(hour, 0, 23),
      dayOfMonth: this.parseField(dayOfMonth, 1, 31),
      month: this.parseField(month, 1, 12),
      dayOfWeek: this.parseField(dayOfWeek, 0, 6),
    };
  },

  parseField(field, min, max) {
    if (field === "*") {
      return { type: "any" };
    }

    if (field.startsWith("*/")) {
      const step = parseInt(field.slice(2), 10);
      if (!isNaN(step) && step > 0) {
        return { type: "step", step };
      }
    }

    if (field.includes(",")) {
      const values = field.split(",").map((v) => parseInt(v, 10));
      if (values.every((v) => !isNaN(v) && v >= min && v <= max)) {
        return { type: "list", values };
      }
    }

    if (field.includes("-")) {
      const [start, end] = field.split("-").map((v) => parseInt(v, 10));
      if (!isNaN(start) && !isNaN(end) && start >= min && end <= max) {
        return { type: "range", start, end };
      }
    }

    const value = parseInt(field, 10);
    if (!isNaN(value) && value >= min && value <= max) {
      return { type: "exact", value };
    }

    return { type: "any" };
  },

  matchesField(fieldSpec, value) {
    switch (fieldSpec.type) {
      case "any":
        return true;
      case "exact":
        return value === fieldSpec.value;
      case "step":
        return value % fieldSpec.step === 0;
      case "list":
        return fieldSpec.values.includes(value);
      case "range":
        return value >= fieldSpec.start && value <= fieldSpec.end;
      default:
        return false;
    }
  },

  shouldRun(parsed, date) {
    return (
      this.matchesField(parsed.minute, date.getMinutes()) &&
      this.matchesField(parsed.hour, date.getHours()) &&
      this.matchesField(parsed.dayOfMonth, date.getDate()) &&
      this.matchesField(parsed.month, date.getMonth() + 1) &&
      this.matchesField(parsed.dayOfWeek, date.getDay())
    );
  },

  tick() {
    const now = new Date();
    const nowMinute = Math.floor(now.getTime() / 60000);

    for (const [name, task] of tasks) {
      if (this.shouldRun(task.parsed, now)) {
        if (task.lastRun !== nowMinute) {
          task.lastRun = nowMinute;
          try {
            task.callback();
          } catch {}
        }
      }
    }
  },

  start(intervalMs = 60000) {
    this.tick();
    return setInterval(() => this.tick(), intervalMs);
  },

  getIntervalFromCron(cronExpression) {
    const parsed = this.parseExpression(cronExpression);
    if (!parsed) return null;

    if (parsed.hour.type === "step") {
      return parsed.hour.step * 60 * 60 * 1000;
    }
    if (parsed.minute.type === "step") {
      return parsed.minute.step * 60 * 1000;
    }

    return 60 * 60 * 1000;
  },

  getTasks() {
    return Array.from(tasks.keys());
  },
};
