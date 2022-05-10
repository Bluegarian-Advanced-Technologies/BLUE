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
    const document = new this.schema(value);
    this.values.push(document);

    document.save();

    return document;
  }
  async update(query, cb) {
    const document = this.schema.findOneAndUpdate(query).then((doc) => console.log(doc));

    cb(this.values);

    // this.values = this.values.filter((g) =>
    //   Object.keys(g)
    //     .map((key) => query[key] === g[key])
    //     .every((value) => value)
    // );
    // this.values.push(document.value);
  }

  async delete(query, cb) {
    const document = await this.schema.findOneAndDelete(query);

    cb(this.values);

    // this.values = this.values.filter((g) =>
    //   Object.keys(g)
    //     .map((key) => query[key] === g[key])
    //     .every((value) => value)
    // );
  }
}

module.exports = LiveCollection;
