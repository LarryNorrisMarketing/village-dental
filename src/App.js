import { Dialog, DialogContent } from '@mui/material';
import logo from './assets/villagedental_logo.png';
import { useEffect, useState } from 'react';
import axios from 'axios';

const apiBase = process.env.NODE_ENV === 'development' ? 'http://192.168.0.164:8080/api/' : '/api/';

const axiosClient = axios.create({
  baseURL: apiBase
});

const rooms = [
  { name: 'Front Desk' },
  { name: 'Hygiene #1' },
  { name: 'Hygiene #2' },
  { name: 'OP #1' },
  { name: 'OP #2' },
  { name: 'OP #3' },
  { name: 'OP #4' },
  { name: 'OP #5' },
  { name: 'OP #6' },
  { name: 'OP #7' },
];


const initialRoomsState = rooms.map(room => ({
  name: room.name,
  buttonText: room.name,
  originalText: room.name,
  timer: 0,
  activateTimestamp: null,
}));

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomsState, setRoomsState] = useState(initialRoomsState);

  const handleRoomButtonClick = (roomName) => {
    const room = roomsState.find(room => room.name === roomName);

    // Check if the button text has been changed
    if (room.buttonText !== room.originalText) {
      // If it has been changed, revert to the original text and clear the timestamp
      const updatedRooms = roomsState.map(room => {
        if (room.name === roomName) {
          return { ...room, buttonText: room.originalText, timer: 0, activateTimestamp: null };
        }
        return room;
      });
      setRoomsState(updatedRooms);
    } else {
      // If it hasn't been changed, open the modal and update the timestamp
      setSelectedRoom(roomName);
      const updatedRooms = roomsState.map(room => {
        if (room.name === roomName) {
          return { ...room, activateTimestamp: Date.now() };
        }
        return room;
      });
      setRoomsState(updatedRooms);
      setModalOpen(true);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  const handleModalButtonClick = (buttonText) => {
    const updatedRooms = roomsState.map(room => {
      if (room.name === selectedRoom) {
        return { ...room, buttonText, activateTimestamp: Date.now() };
      }
      return room;
    });

    setRoomsState(updatedRooms);
    setModalOpen(false);
  };

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const updatedRooms = roomsState.map(room => {
        if (room.buttonText !== room.originalText && room.activateTimestamp) {
          const currentTime = Date.now();
          const timeElapsed = Math.floor((currentTime - room.activateTimestamp) / 1000);
          return { ...room, timer: timeElapsed };
        }
        return room;
      });
      setRoomsState(updatedRooms);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [roomsState]);

  useEffect(() => {
    async function pollServer() {
      const { data } = await axiosClient.get('rooms');
      console.log(data);
    }

    pollServer();
  }, []);

  return (
    <div>
      <header>
        <img src={logo} alt="" style={{
          height: '5rem',
          paddingTop: '1rem',
          filter: 'drop-shadow(0px 0px 4px #ffffff)'
        }}
        />
      </header>

      <main>
        <div className='main-content'>
          <div className='rooms-container'>
            {
              roomsState.map(room => {
                let addedClassName = '';
                const isActiveButton = room.buttonText !== room.originalText;

                if (isActiveButton) {
                  addedClassName += room.buttonText;

                  if (room.timer <= 4000) {
                    addedClassName += ' pulse-primary';
                  }
                }

                return (
                  <div className='room-container' key={room.name}>
                    <div
                      className={`room-btn ${addedClassName}`}
                      onClick={() => handleRoomButtonClick(room.name)}>
                      {
                        room.buttonText === room.originalText ?
                          room.originalText
                          :
                          <div>
                            <div className='active-btn room'>{room.originalText}</div>
                            {room.buttonText}
                            <div className='active-btn timer'>{formatTimer(room.timer)}</div>
                          </div>
                      }
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </main>

      <Dialog
        PaperProps={{
          className: 'modal'
        }}
        open={modalOpen}
        onClose={handleClose}>
        <DialogContent>
          <div>
            <button
              onClick={() => handleModalButtonClick('Dr. Needed')}
              className='dr-needed'>Dr. Needed</button>
            <button
              onClick={() => handleModalButtonClick('Assistant Needed')}
              className='assistant-needed'>Assistant Needed</button>
            <button
              onClick={() => handleModalButtonClick('Patient Arrived')}
              className='patient-arrived'>Patient Arrived</button>
          </div>
        </DialogContent>

      </Dialog>
    </div>
  );
}

export default App;


function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = seconds % 60;
  const formattedTime = `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
  return formattedTime;
}