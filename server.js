const express = require('express');
const path = require('path');

const app = express();

app.set('trust proxy', 1);

if (process.env.NODE_ENV === 'development') {
  const cors = require('cors');

  app.use(cors({
    origin: ['http://localhost:3000', 'http://192.168.0.164:3000']
  }));
}

app.use(express.static(path.join(__dirname + '/../', 'build')));

const rooms = {
  'Front Desk': {
    activateTimestamp: null,
    activateReason: null,
    name: 'Front Desk'
  },
  'Hygiene #1': {
    activateTimestamp: null,
    activateReason: null,
    name: 'Hygiene #1'
  },
  'Hygiene #2': {
    activateTimestamp: null,
    activateReason: null,
    name: 'Hygiene #2'
  },
  'OP #1': {
    activateTimestamp: null,
    activateReason: null,
    name: 'OP #1'
  },
  'OP #2': {
    activateTimestamp: null,
    activateReason: null,
    name: 'OP #2'
  },
  'OP #3': {
    activateTimestamp: null,
    activateReason: null,
    name: 'OP #3'
  },
  'OP #4': {
    activateTimestamp: null,
    activateReason: null,
    name: 'OP #4'
  },
  'OP #5': {
    activateTimestamp: null,
    activateReason: null,
    name: 'OP #5'
  },
  'OP #6': {
    activateTimestamp: null,
    activateReason: null,
    name: 'OP #6'
  },
  'OP #7': {
    activateTimestamp: null,
    activateReason: null,
    name: 'OP #7'
  }
};

app.use(express.json());

app.get('/api/rooms', (_, res) => {
  return res.json(rooms);
});

app.put('/api/rooms', (req, res) => {
  const {
    roomName,
    activateTimestamp,
    activateReason
  } = req.body;
  if (!roomName || !rooms[roomName]) {
    return res.json({ error: true, message: 'Invalid room' });
  }

  rooms[roomName] = {
    ...rooms[roomName],
    activateReason,
    activateTimestamp
  };

  return res.json({ success: true });
});

app.get('*', (_, res) => {
  return res.sendFile(path.join(__dirname + '/../', 'build', 'index.html'));
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});