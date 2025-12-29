
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/conversionsdb';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db, conversions;

async function initDb() {
  try {
    const client = new MongoClient(DB_URI, { useUnifiedTopology: true });
    await client.connect();
    db = client.db('conversionsdb');
    conversions = db.collection('conversions');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
}

app.post('/convert', async (req, res) => {
  try {
    const { value, direction } = req.body;
    if (typeof value !== 'number' || isNaN(value)) {
      return res.status(400).json({ error: 'Invalid value' });
    }
    if (!['C_TO_F', 'F_TO_C'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid direction' });
    }

    let result;
    if (direction === 'C_TO_F') {
      result = (value * 9/5) + 32;
    } else {
      result = (value - 32) * 5/9;
    }

    const doc = {
      inputValue: value,
      fromUnit: direction === 'C_TO_F' ? 'C' : 'F',
      toUnit: direction === 'C_TO_F' ? 'F' : 'C',
      outputValue: result,
      timestamp: new Date()
    };
    try {
      if (conversions) { await conversions.insertOne(doc); }
    } catch (e) { console.error('Insert error:', e.message); }

    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/history', async (req, res) => {
  try {
    if (!conversions) return res.json([]);
    const last = await conversions.find({}).sort({ timestamp: -1 }).limit(10).toArray();
    res.json(last.map(d => ({
      inputValue: d.inputValue,
      fromUnit: d.fromUnit,
      toUnit: d.toUnit,
      outputValue: d.outputValue,
      timestamp: d.timestamp
    })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initDb();
});
