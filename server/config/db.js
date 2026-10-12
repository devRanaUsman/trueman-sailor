import mongoose from 'mongoose';

const originalConnect = mongoose.connect;
const originalDisconnect = mongoose.disconnect;

const stores = {};

function getStore(modelName) {
  if (!stores[modelName]) {
    stores[modelName] = [];
  }
  return stores[modelName];
}

function filterData(store, query) {
  if (!query || Object.keys(query).length === 0) return [...store];
  
  return store.filter(item => {
    for (const [key, val] of Object.entries(query)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if (val.$in) {
          if (!val.$in.includes(item[key])) return false;
        }
        if (val.$gte) {
          if (item[key] < val.$gte) return false;
        }
        if (val.$lte) {
          if (item[key] > val.$lte) return false;
        }
      } else {
        if (String(item[key]) !== String(val)) return false;
      }
    }
    return true;
  });
}

function populateItem(item, path, fields) {
  const id = item[path];
  if (!id) return item;
  
  let refModelName = '';
  if (path === 'stylist') refModelName = 'Stylist';
  else if (path === 'user') refModelName = 'User';
  else if (path === 'booking') refModelName = 'Booking';
  else if (path === 'service') refModelName = 'Service';
  
  if (refModelName && stores[refModelName]) {
    const refStore = stores[refModelName];
    const refItem = refStore.find(d => String(d._id) === String(id));
    if (refItem) {
      const populated = { ...refItem };
      if (fields && typeof fields === 'string') {
        const keep = fields.split(' ');
        const filtered = { _id: populated._id };
        for (const k of keep) {
          if (populated[k] !== undefined) filtered[k] = populated[k];
        }
        item[path] = filtered;
      } else {
        item[path] = populated;
      }
    }
  }
  return item;
}

class MockQuery {
  constructor(data, modelName) {
    this.data = data;
    this.modelName = modelName;
  }
  sort(sortObj) {
    if (!sortObj || !Array.isArray(this.data)) return this;
    const key = Object.keys(sortObj)[0];
    const order = sortObj[key];
    this.data.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;
      if (typeof valA === 'string') {
        return order === -1 ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return order === -1 ? valB - valA : valA - valB;
    });
    return this;
  }
  select(selectStr) {
    return this;
  }
  limit(num) {
    if (Array.isArray(this.data)) {
      this.data = this.data.slice(0, num);
    }
    return this;
  }
  populate(path, fields) {
    if (!Array.isArray(this.data)) {
      if (this.data) this.data = populateItem(this.data, path, fields);
    } else {
      this.data = this.data.map(item => populateItem(item, path, fields));
    }
    return this;
  }
  async then(resolve, reject) {
    try {
      resolve(this.data);
    } catch (err) {
      if (reject) reject(err);
    }
  }
  catch(fn) {
    return this;
  }
}

function mockExistingModelClass(RealModel, name) {
  const store = getStore(name);

  RealModel.deleteMany = async function () {
    store.length = 0;
    return { deletedCount: 0 };
  };

  RealModel.insertMany = async function (array) {
    const docs = [];
    for (const item of array) {
      const doc = new RealModel(item);
      await doc.save();
      docs.push(doc);
    }
    return docs;
  };

  RealModel.create = async function (data) {
    if (Array.isArray(data)) {
      return this.insertMany(data);
    }
    const doc = new RealModel(data);
    await doc.save();
    return doc;
  };

  RealModel.find = function (query) {
    const results = filterData(store, query);
    return new MockQuery(results, name);
  };

  RealModel.findOne = function (query) {
    const results = filterData(store, query);
    const item = results.length > 0 ? results[0] : null;
    const q = new MockQuery(item, name);
    q.select = function() { return this; };
    return q;
  };

  RealModel.findById = function (id) {
    const item = store.find(d => String(d._id) === String(id)) || null;
    return new MockQuery(item, name);
  };

  RealModel.findByIdAndUpdate = async function (id, update, options) {
    const item = store.find(d => String(d._id) === String(id));
    if (!item) return null;

    if (update.$set) {
      Object.assign(item, update.$set);
    } else {
      Object.assign(item, update);
    }
    item.updatedAt = new Date();
    return item;
  };

  RealModel.updateOne = async function (query, update) {
    const results = filterData(store, query);
    if (results.length > 0) {
      const item = results[0];
      if (update.$set) {
        Object.assign(item, update.$set);
      } else {
        Object.assign(item, update);
      }
      item.updatedAt = new Date();
    }
    return { matchedCount: results.length, modifiedCount: results.length };
  };

  RealModel.countDocuments = async function (query) {
    const results = filterData(store, query);
    return results.length;
  };

  RealModel.aggregate = async function (pipeline) {
    let data = [...store];

    for (const stage of pipeline) {
      if (stage.$match) {
        data = filterData(data, stage.$match);
      }
      if (stage.$group) {
        const groupKey = stage.$group._id;
        if (groupKey === null) {
          let total = 0;
          for (const item of data) {
            if (stage.$group.total && stage.$group.total.$sum) {
              const field = stage.$group.total.$sum.replace('$', '');
              total += Number(item[field]) || 0;
            }
          }
          return [{ _id: null, total }];
        } else {
          const fieldName = groupKey.replace('$', '');
          const groups = {};
          for (const item of data) {
            const keyVal = item[fieldName];
            if (!groups[keyVal]) groups[keyVal] = [];
            groups[keyVal].push(item);
          }

          const result = [];
          for (const [keyVal, items] of Object.entries(groups)) {
            const groupResult = { _id: keyVal };
            if (stage.$group.avg && stage.$group.avg.$avg) {
              const avgField = stage.$group.avg.$avg.replace('$', '');
              const sum = items.reduce((acc, x) => acc + (Number(x[avgField]) || 0), 0);
              groupResult.avg = sum / items.length;
            }
            if (stage.$group.count && stage.$group.count.$sum) {
              groupResult.count = items.length;
            }
            result.push(groupResult);
          }
          return result;
        }
      }
    }
    return data;
  };

  RealModel.prototype.populate = async function (path, fields) {
    populateItem(this, path, fields);
    return this;
  };

  RealModel.prototype.save = async function () {
    if (!this._id) {
      this._id = 'mock_' + Math.random().toString(36).substring(2, 9);
      this.createdAt = new Date();
      this.updatedAt = new Date();
      store.push(this);
    } else {
      this.updatedAt = new Date();
      const idx = store.findIndex(item => String(item._id) === String(this._id));
      if (idx !== -1) {
        store[idx] = this;
      } else {
        store.push(this);
      }
    }
    return this;
  };
}

function applyInMemoryMock() {
  mongoose.connect = async () => console.log('Mock Mongoose Connected.');
  mongoose.disconnect = async () => console.log('Mock Mongoose Disconnected.');
  mongoose.set = () => {};

  for (const [name, RealModel] of Object.entries(mongoose.models)) {
    mockExistingModelClass(RealModel, name);
  }
}

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trueman';
  
  try {
    console.log(`Connecting to MongoDB at ${uri}...`);
    // Attempt real connection with a 4-second timeout to avoid long hangs
    await originalConnect.call(mongoose, uri, { serverSelectionTimeoutMS: 4000 });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    
    // Seed if empty
    const Service = mongoose.model('Service');
    const count = await Service.countDocuments({});
    if (count === 0) {
      console.log('Database is empty. Seeding initial data...');
      const { seedData } = await import('../seed_helper.js');
      await seedData();
      console.log('Database seeded successfully.');
    }
  } catch (err) {
    console.log(`Could not connect to MongoDB at ${uri} (${err.message}).`);
    console.log('Falling back to in-memory Mock Mongoose...');
    
    applyInMemoryMock();
    
    console.log('Auto-seeding in-memory mock database...');
    try {
      const { seedData } = await import('../seed_helper.js');
      await seedData();
      console.log('Mock database seeded successfully.');
    } catch (seedErr) {
      console.error('Mock seeding failed:', seedErr);
    }
  }
}
