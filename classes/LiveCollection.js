// Thank you ComputerGeek12 for aid in this class

class LiveCollection {
  values = [];
  constructor(schema) {
    this.schema = schema;
  }

  async init() {
    const docs = await this.schema.find({});
    this.values = docs;
  }

  get(query) {
    const obj = this.values.find((value) =>
      Object.keys(value)
        .map((k) => query[k] === value[k])
        .every((v) => v)
    );

    return obj;
  }

  getAll() {
    return this.values;
  }

  async set(value) {
    const document = await this.schema.create(value);
    this.values.push(document);

    return document;
  }
  async update(query, value) {
    // update is like schema.findOneAndUpdate(query, value)
    const document = await this.schema.findOneAndUpdate(query, value);
    this.values = this.values.filter((g) =>
      Object.keys(g)
        .map((key) => query[key] === g[key])
        .every((value) => value)
    );
    this.values.push(document);

    return document;
  }

  async delete(query) {
    const document = await this.schema.findOneAndDelete(query);
    this.values = this.values.filter((g) =>
      Object.keys(g)
        .map((key) => query[key] === g[key])
        .every((value) => value)
    );
    return document;
  }
}

module.exports = LiveCollection;
