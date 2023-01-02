import { useState, useEffect } from "react";
import { database } from "./firebase";
import { ref, set, onValue, get, child } from 'firebase/database'

function App() {
  const [ firstPlayerTurn, setFirstPlayerTurn ] = useState(true);
  const board:Array<Array<string>> = new Array(10)
  for (let i = 0; i < 10; i++) board[i] = new Array(10);
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      board[i][j] = '?';
    }
  }
  const [ title, setTitle ] = useState("Battleship");
  const [ userNameInput, setUserNameInput ] = useState('');
  const [ userData, setUserData ] = useState<{name: string, wins: number, losses: number}>();
  const [ userDataLoading, setUserDataLoading ] = useState(false);
  const [ page, setPage ] = useState('login');
  const [ gameLoading, setGameLoading ] = useState(false);
  const [ gameData, setGameData ] = useState<Game>()
  const [ gameMessage, setGameMessage ] = useState('') 
  const [ myGameBoard, setMyGameBoard ] = useState<Array<Array<string>>>();
  const [ theirGameBoard, setTheirGameBoard ] = useState<Array<Array<string>>>();
  const [ myPlayerNumber, setMyPlayerNumber ] = useState<number>();
  const [ player1Turn, setPlayer1Turn ] = useState<boolean>();

  interface Game {
    board: Array<Array<string>>,
    player1: string,
    player2: string,
    state: string,
    player1Board: Array<Array<string>>,
    player2Board: Array<Array<string>>,
    player1Turn: boolean,
  }

  const loginOrRegister = (userName: string) => {
    setUserDataLoading(true);
    const userRef = ref(database, "users/" + userName);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserDataLoading(false);
        setUserData(data)
      } else {
        setUserDataLoading(false);
        set(userRef, {
          name: userName,
          wins: 0,
          losses: 0,
        });
      }
    })
    setPage('selectOption')
  }

  const joinGame = () => {
    if (!userData) return;
    setPage("joinGame")
    setGameLoading(true)
    const gameRef = ref(database, "game/");
    get(child(ref(database), "game/")).then(snapshot => {
      if (snapshot.exists()) {
        console.log(snapshot.val());
        const data:Game = snapshot.val()
        switch (data.state) {
          case "waiting for players":
            setGameMessage("Greetings player 1, waiting on player 2 to connect...");
            set(gameRef, {
              player1: userData.name,
              player2: data.player2,
              state: 'waiting on player 2',
              board: data.board,
              player1Turn: false,
            })
            setGameData(data);
            setMyPlayerNumber(1);
            break;
          case "waiting on player 2":
            setGameMessage("Greetings player 2, initializing game...");
            set(gameRef, {
              player1: data.player1,
              player2: userData.name,
              state: "in progress",
              board: data.board,
              player1Turn: true,
              player1Board: data.board,
              player2Board: data.board,
            })
            setMyPlayerNumber(2);
            setGameData(data);
            setGameMessage(`Game: ${data?.player1} vs ${data?.player2}`);
            initializeGame();
            break;
          default:
            console.error("unknown state received from server");
            break;
        }
      } else {
        console.log("game does not exist");
      }
    }).catch(err => console.error(err))
    setGameLoading(false);
  }

  // useEffect(() => {
  //   return () => {
  //     const board:Array<Array<string>> = new Array(10)
  //     for (let i = 0; i < 10; i++) board[i] = new Array(10);
  //     for (let i = 0; i < 10; i++) {
  //       for (let j = 0; j < 10; j++) {
  //         board[i][j] = '?';
  //       }
  //     }
  //     get(child(ref(database), "game/")).then(snapshot => {
  //       if (snapshot.exists()) {
  //         const gameData:Game = snapshot.val();
  //         if (gameData.state === 'in progress') {
  //           set (ref(database, "game/"), {
  //             player1: '',
  //             player2: '',
  //             state: 'waiting for players',
  //             board: board,
  //             player1Turn: false,
  //           })
  //         }
  //       }
  //     })
  //   }
  // }, [])

  const initializeGame = () => {
    if (!userData) return;
    setPage('playGame');
    onValue(ref(database, "game"), snapshot => {
      const data:Game = snapshot.val();
      if (myPlayerNumber === 1) {
        setMyGameBoard(data.player1Board);
        setTheirGameBoard(data.player2Board);
      } else {
        setMyGameBoard(data.player2Board);
        setTheirGameBoard(data.player1Board);
      }
      setGameData(data);
      if (data.player1Turn) {
        setPlayer1Turn(true);
      } else {
        setPlayer1Turn(false);
      }
    })
  }

  const spectateGame = () => {

  }

  const sendSelection = (row: number, col: number) => {
    if (!gameData || !userData || !theirGameBoard) return;
    let tempGameBoard = theirGameBoard;
    tempGameBoard[row][col] = 'X';
    setMyGameBoard(tempGameBoard)
    if (myPlayerNumber === 1) {
      setGameData({
        ...gameData,
        player2Board: theirGameBoard,
      })
    } else {
      setGameData({
        ...gameData,
        player1Board: theirGameBoard,
      })
    }
    set(ref(database, "game/"), gameData)
  }

  const handleClick = (row: number, col: number) => {
    if (!userData || !gameData) return;
    sendSelection(row, col);
  }

  // console.log(gameData)
  

  return (
    <div className="relative h-screen w-full bg-zinc-900 pt-10 pb-2 px-2">
      {userData && <div className="absolute left-4 top-2 flex flex-row">
        <p className="text-white/90 text-xl bg-zinc-800 rounded-xl px-2 hover:text-white mr-4 transition">User: {userData?.name}</p>
        <p className="text-white/90 text-xl bg-zinc-800 rounded-xl px-2 hover:text-white mr-4 transition">Wins: {userData?.wins}</p>
        <p className="text-white/90 text-xl bg-zinc-800 rounded-xl px-2 hover:text-white mr-4 transition">Losses: {userData?.losses}</p>
      </div>}
      {userData && <button className="absolute right-4 top-2 bg-zinc-800 hover:bg-zinc-700 transition px-2 rounded-xl text-white/90 hover:text-white text-xl active:bg-zinc-800"
        onClick={() => {
          setUserData(undefined);
          setPage("login");
          setUserNameInput('')
        }}>Logout</button>}
      <div className="h-full w-full bg-slate-300 rounded-xl p-2">
        <div className="text-xl text-center flex flex-col items-center">
          <h1 className="text-4xl peer">{title}</h1>
          {page === 'login' && <form className="text-xl text-center flex flex-col items-center"
            onSubmit={(e) => {
              e.preventDefault()
              loginOrRegister(userNameInput)
            }}  
          >
            <input 
              type="text"
              placeholder="User Name"
              className="rounded-xl p-2 w-40 m-2 transition peer"
              onChange={(e) => setUserNameInput(e.target.value)}
              value={userNameInput}
              required
            />
            {userNameInput && <button className="transition opacity-0 peer-valid:opacity-100 border-black/50 border-2 px-4 py-2 rounded-full active:bg-slate-400 hover:bg-slate-400/50 cursor-pointer" 
              onClick={() => loginOrRegister(userNameInput)}>Login/Register</button>}
          </form>}
          {page === 'selectOption' && <div>
            {userDataLoading && <p className="text-3xl">Loading...</p>}
            {userData &&
              <div className="flex flex-col mt-4">
                <button className="border-black/50 border-2 px-4 py-2 m-2 rounded-full active:bg-slate-400 hover:bg-slate-400/50 select-none" onClick={() => joinGame()}>Join a game</button>
                <button className="border-black/50 border-2 px-4 py-2 m-2 rounded-full active:bg-slate-400 hover:bg-slate-400/50 select-none" onClick={() => spectateGame()}>Spectate</button>
              </div>
            }
          </div>}
          {page === 'joinGame' && <div>
            {gameLoading && <p className="text-3xl">Loading game data...</p>}
            {!gameLoading && <p className="text-3xl">{gameMessage}</p>}
          </div>}
          {page === 'playGame' &&
            <div>
              <p className="text-3xl">{gameMessage}</p>  
              {myGameBoard && theirGameBoard &&
              <div>
                <div>
                  <p>{userData?.name}</p>
                  <Board board={myGameBoard} handleClick={handleClick} />
                </div>
                <div>
                  <p>{myPlayerNumber === 1 ? gameData?.player2 : gameData?.player1}</p>
                  <Board board={theirGameBoard} handleClick={handleClick} />
                </div>
              </div>}
            </div>
          }
        </div>  
      </div>
    </div>
  )
}

const Board = (
  {board, handleClick}: 
  {board: Array<Array<string>>, handleClick: (i: number, j: number) => void}
) => {
  console.log(board)
  return (
    <table className="table-fixed border-collapse w-full h-full">
      <thead>
        <tr>
          {Array.from(" ABCDEFGHIJ").map(letter => <th key={letter} className="border border-slate-600">{letter}</th>)}
        </tr>
      </thead>
      <tbody>
        {board.map((row, i) => {
          return (
            <tr key={i}>
              <td className="border border-slate-600 font-bold text-center">{i + 1}</td>
              {row.map((col, j) => {
                // console.log(`location at ${i}${j}: ${board[i][j]}`)
                return <td key={`${i}${j}`} className="border border-slate-600 text-center hover:bg-slate-700 hover:text-white cursor-pointer select-none" 
                    onClick={() => handleClick(i, j)}
                  >
                    {`${i}${j}: ${board[i][j]}`}
                  </td>
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default App
