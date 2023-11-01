import { Button, Dialog, DialogContent } from '@mui/material';
import logo from './assets/villagedental_logo.png';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import drTone from './assets/DrTone.mp3';
import assistantTone from './assets/AssistantNeeded.mp3';
import patientTone from './assets/patientArrived.mp3';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import timerTone from './assets/timer-alaram.mp3';

let drAudio = null;
let assistantAudio = null;
let patientAudio = null;
let timerAudio = null;

const timerSeconds = 300;

const apiBase = process.env.NODE_ENV === 'development' ? 'http://192.168.0.164:8080/api/' : '/api/';

const axiosClient = axios.create({
  baseURL: apiBase
});

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomsState, setRoomsState] = useState(null);
  const [roomTimer, setRoomTimer] = useState(timerSeconds);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [loading, setLoading] = useState(true);

  const prevRoomsState = useRef(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
  const formattedHours = hours % 12 || 12;

  const handleStart = () => {
    async function getInitialState() {
      try {
        const { data } = await axiosClient.get('rooms');
        const theState = Object.values(data);

        prevRoomsState.current = theState;
        setRoomsState(theState);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial state:', error);
      }
    }

    drAudio = new Audio(drTone);
    assistantAudio = new Audio(assistantTone);
    patientAudio = new Audio(patientTone);
    timerAudio = new Audio(timerTone);
    timerAudio.loop = true;

    setStartModalOpen(false);
    getInitialState();
  };

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

        prevRoomsState.current.forEach(prevRoomState => {
          const currentActivateReason = data[prevRoomState.name].activateReason;
          if (currentActivateReason && !prevRoomState.activateReason) {
            if (currentActivateReason === 'Dr. Needed') {
              drAudio.play();
            } else if (currentActivateReason === 'Assistant Needed') {
              assistantAudio.play();
            } else if (currentActivateReason === 'Patient Arrived') {
              patientAudio.play();
            }
          }
        });

        const newState = Object.values(data);
        prevRoomsState.current = newState;
        setRoomsState(newState);
      } catch (error) {
        console.error('Error polling the server:', error);
      }
    }

    if (!loading) {
      const pollingInterval = setInterval(pollServer, 1000);
      return () => clearInterval(pollingInterval);
    }
  }, [loading]);

  if (loading && !startModalOpen) {
    return <div
      style={{
        color: 'white',
        fontSize: '4rem',
        padding: '2rem'
      }}>Loading...
    </div>;
  }

  const startRoomTimer = () => {
    window.roomTimer = setInterval(() => {
      setRoomTimer(old => {
        if (old === 1) {
          clearInterval(window.roomTimer);
          timerAudio.play();
        }
        return old - 1;
      });
    }, 1000);
  };

  const resetRoomTimer = () => {
    clearInterval(window.roomTimer);
    timerAudio.pause();
    timerAudio.currentTime = 0;
    setRoomTimer(timerSeconds);
  };

  return (
    <div>
      <header>
        <img src={logo} alt="" style={{
          height: '5rem',
          paddingTop: '1rem',
          filter: 'drop-shadow(0px 0px 4px #ffffff)'
        }}
        />
        <div className='room-timer'>
          <div style={{ width: 170 }}>
            {`${formattedHours}:${minutes}:${seconds}`}
          </div>
        </div>
        <div className='room-timer'>
          <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            {formatTimer(roomTimer)}
            {
              roomTimer < timerSeconds ?
                <Button
                  startIcon={<RestartAltIcon />}
                  size='large'
                  color='secondary'
                  onClick={resetRoomTimer}
                  variant='contained'>
                  Reset
                </Button>
                :
                <Button
                  color='secondary'
                  onClick={startRoomTimer}
                  startIcon={<PlayCircleOutlineIcon />}
                  size='large'
                  variant='contained'>
                  Start
                </Button>
            }
          </div>
        </div>
      </header>

      <main>
        <div className='main-content'>
          <div className='rooms-container'>
            {
              roomsState?.map(room => {
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

      <Dialog
        PaperProps={{
          className: 'modal'
        }}
        open={startModalOpen}>
        <DialogContent>
          <div>
            <button
              style={{
                fontSize: '2.5rem',
                background: '#1b6ec2',
                color: 'white'
              }}
              onClick={handleStart}>
              Start
            </button>
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