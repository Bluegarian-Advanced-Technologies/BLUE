// Thank you ComputerGeek12 for aid in this class

import { DatabaseSchema } from "@nextium/common";
import { Document, Filter, OptionalId, UpdateFilter } from "mongodb";

class LiveCollection {
  schema: DatabaseSchema;
  values: OptionalId<Document>[] = [];

  constructor(schema: DatabaseSchema) {
    this.schema = schema;
  }

  async initialize() {
    this.values = await this.schema.find({}) || [];
    // this.cached = true;
  }

  get(query: Filter<Document>) {
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

  async set(value: OptionalId<Document>) {
    const document = await this.schema.create(value);
    this.values.push(value);
    return document;
  }
  
  async update(filter: Filter<Document>, update: UpdateFilter<Document>) {
    const query = await this.schema.findOneAndUpdate(filter, update);
    const obj = this.values.find((value) =>
      Object.keys(value)
        .map((k) => filter[k] === value[k])
        .every((v) => v)
    );

    if (obj != null) {
      Object.assign(obj, query);
    }
    return query;
  }

  async delete(filter: Filter<Document>) {
    return await this.schema.findOneAndDelete(filter);
  }
}

export default LiveCollection;
