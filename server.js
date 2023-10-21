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
  'Front Desk': { activateTimestamp: null, activateReason: null },
  'Hygiene #1': { activateTimestamp: null, activateReason: null },
  'Hygiene #2': { activateTimestamp: null, activateReason: null },
  'OP #1': { activateTimestamp: null, activateReason: null },
  'OP #2': { activateTimestamp: null, activateReason: null },
  'OP #3': { activateTimestamp: null, activateReason: null },
  'OP #4': { activateTimestamp: null, activateReason: null },
  'OP #5': { activateTimestamp: null, activateReason: null },
  'OP #6': { activateTimestamp: null, activateReason: null },
  'OP #7': { activateTimestamp: null, activateReason: null }
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