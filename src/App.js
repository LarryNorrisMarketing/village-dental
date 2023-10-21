import { Dialog, DialogContent } from '@mui/material';
import logo from './assets/villagedental_logo.png';
import { useEffect, useState } from 'react';
import axios from 'axios';

const apiBase = process.env.NODE_ENV === 'development' ? 'http://192.168.0.164:8080/api/' : '/api/';

const axiosClient = axios.create({
  baseURL: apiBase
});

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomsState, setRoomsState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getInitialState() {
      try {
        const { data } = await axiosClient.get('rooms');
        setRoomsState(Object.values(data));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial state:', error);
      }
    }

    getInitialState();
  }, []);

  const handleRoomButtonClick = async (roomName) => {
    try {
      const room = roomsState.find(room => room.name === roomName);

      if (room.activateReason) {
        // If it has been changed, revert to the original text and clear the timestamp
        await axiosClient.put('rooms', {
          roomName,
          activateTimestamp: null,
          activateReason: null
        });
      } else {
        // If it hasn't been changed, open the modal and update the timestamp
        setSelectedRoom(roomName);
        setModalOpen(true);
      }
    } catch (error) {
      console.log('Error in handleRoomButtonClick:', error);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  const handleModalButtonClick = async (buttonText) => {
    await axiosClient.put('rooms', {
      roomName: selectedRoom,
      activateTimestamp: Date.now(),
      activateReason: buttonText
    });
    setModalOpen(false);
  };


  useEffect(() => {
    async function pollServer() {
      try {
        const { data } = await axiosClient.get('rooms');
        setRoomsState(Object.values(data));
      } catch (error) {
        console.error('Error polling the server:', error);
      }
    }

    if (!loading) {
      const pollingInterval = setInterval(pollServer, 1000);
      return () => clearInterval(pollingInterval);
    }
  }, [loading]);

  if (loading) {
    return <div
      style={{
        color: 'white',
        fontSize: '4rem',
        padding: '2rem'
      }}>Loading...
    </div>;
  }

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
                const {
                  activateTimestamp,
                  activateReason,
                  name
                } = room;

                let addedClassName = '';
                let timeElapsed = '';

                if (activateReason) {
                  addedClassName += activateReason;

                  timeElapsed = Math.floor((Date.now() - activateTimestamp) / 1000);

                  if (timeElapsed <= 240) {
                    addedClassName += ' pulse-primary';
                  } else if (timeElapsed <= 480) {
                    addedClassName += ' pulse-warning';
                  } else {
                    addedClassName += ' pulse-error';
                  }
                }

                return (
                  <div className='room-container' key={name}>
                    <div
                      className={`room-btn ${addedClassName}`}
                      onClick={() => handleRoomButtonClick(name)}>
                      {
                        !activateReason ?
                          name
                          :
                          <div>
                            <div className='active-btn room'>{name}</div>
                            {activateReason}
                            <div className='active-btn timer'>{formatTimer(timeElapsed)}</div>
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