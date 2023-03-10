import { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, set, onValue, get, child } from 'firebase/database';
import { Ships, ShipDistances } from './types';

function App() {
    const [firstPlayerTurn, setFirstPlayerTurn] = useState(true);
    const board: Array<Array<string>> = new Array(10);
    for (let i = 0; i < 10; i++) board[i] = new Array(10);
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            board[i][j] = '?';
        }
    }
    const [title, setTitle] = useState('Battleship');
    const [userNameInput, setUserNameInput] = useState('');
    const [userData, setUserData] = useState<{
        name: string;
        wins: number;
        losses: number;
    }>();
    const [userDataLoading, setUserDataLoading] = useState(false);
    const [page, setPage] = useState('login');
    const [gameLoading, setGameLoading] = useState(false);
    const [gameData, setGameData] = useState<Game>();
    const [gameMessage, setGameMessage] = useState('');
    const [myGameBoard, setMyGameBoard] = useState<Array<Array<string>>>();
    const [triggerRender, setTriggerRender] = useState(false);
    const [myPlayerNumber, setMyPlayerNumber] = useState<number>();
    const [player1Turn, setPlayer1Turn] = useState<boolean>();
    const [ships, setShips] = useState<Ships>({
        carrier: {
            start: '',
            end: '',
        },
        battleship: {
            start: '',
            end: '',
        },
        destroyer: {
            start: '',
            end: '',
        },
        submarine: {
            start: '',
            end: '',
        },
        patrol: {
            start: '',
            end: '',
        },
    });
    const [shipsValid, setShipsValid] = useState({
        carrier: false,
        battleship: false,
        destroyer: false,
        submarine: false,
        patrol: false,
    });
    const [allShipsValid, setAllShipsValid] = useState(false);

    interface Game {
        board: Array<Array<string>>;
        player1: string;
        player2: string;
        state: string;
        player1Board: Array<Array<string>>;
        player2Board: Array<Array<string>>;
        player1Turn: boolean;
        player1Placements: Array<Array<string>>;
        player2Placements: Array<Array<string>>;
    }

    useEffect(() => {
        let key: keyof typeof shipsValid;
        const board: Array<Array<string>> = new Array(10);
        for (let i = 0; i < 10; i++) board[i] = new Array(10);
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                board[i][j] = ' ';
            }
        }
        let tempGameBoard = board;
        let numShipsValid = 0;
        for (key in shipsValid) {
            if (shipsValid[key]) {
                placeShip(key, tempGameBoard);
                numShipsValid++;
            }
        }
        if (numShipsValid === 5) setAllShipsValid(true);
        else setAllShipsValid(false);
        // console.log(tempGameBoard)
        setMyGameBoard(tempGameBoard);
        setTriggerRender(!triggerRender);

        // console.log(shipsValid);
    }, [shipsValid]);

    // console.log(myGameBoard);

    const sendShipPlacements = () => {
        get(child(ref(database), 'game/')).then((snapshot) => {
            if (!snapshot.exists()) return;
            const data: Game = snapshot.val();
            if (myPlayerNumber === 1) {
                set(ref(database, 'game/'), {
                    ...data,
                    player1Placements: myGameBoard,
                });
            } else {
                set(ref(database, 'game/'), {
                    ...data,
                    player2Placements: myGameBoard,
                });
            }
        });
        initializeGame();
    };

    const placeShip = (
        shipKey: keyof Ships,
        tempGameBoard: Array<Array<string>>
    ) => {
        const shipDistances: ShipDistances = {
            carrier: 5,
            battleship: 4,
            destroyer: 3,
            submarine: 3,
            patrol: 2,
        };
        const start = ships[shipKey].start;
        const end = ships[shipKey].end;
        const startRow =
            Number(String(start.charAt(1)) + String(start.charAt(2))) - 1;
        const endRow =
            Number(String(end.charAt(1)) + String(end.charAt(2))) - 1;
        // let startRow = 0, endRow = 0, startCol = 0, endCol = 0;
        // if (ships[shipKey].start.length === 2) {
        //   startRow = Number(ships[shipKey].start.charAt(1)) - 1;
        //   endRow = Number(ships[shipKey].end.charAt(1)) - 1;
        // } else if (ships[shipKey].start.length === 3) {
        //   startRow = Number(
        //     String(ships[shipKey].start.charAt(1)) +
        //     String(ships[shipKey].start.charAt(2))
        //   ) - 1;
        //   endRow = Number(
        //     String(ships[shipKey].end.charAt(1)) +
        //     String(ships[shipKey].end.charAt(2))
        //   ) - 1;
        // }
        const startCol =
            Number(
                ships[shipKey].start.slice(0, 1).toUpperCase().charCodeAt(0)
            ) - 65;
        const endCol =
            Number(ships[shipKey].end.slice(0, 1).toUpperCase().charCodeAt(0)) -
            65;
        // console.log({ startRow, endRow });
        // console.log({shipKey, startRow, endRow, startCol, endCol})
        // tempGameBoard[startRow][startCol] = shipKey.charAt(0).toUpperCase();
        // tempGameBoard[endRow][endCol] = shipKey.charAt(0).toUpperCase();
        if (startCol === endCol) {
            // vertical
            for (let i = startRow; i <= endRow; i++) {
                tempGameBoard[i][startCol] = shipKey.charAt(0).toUpperCase();
            }
        } else {
            // horizontal
            for (let i = startCol; i <= endCol; i++) {
                tempGameBoard[startRow][i] = shipKey.charAt(0).toUpperCase();
            }
        }
        // console.log(tempGameBoard)
    };

    const loginOrRegister = (userName: string) => {
        // console.log("clicked log in")
        setUserDataLoading(true);
        const userRef = ref(database, 'users/' + userName);

        get(child(ref(database), `users/${userName}`))
            .then(snapshot => {
                if (snapshot.val()) {
                    // console.log(snapshot.val());
                    setUserDataLoading(false);
                    setUserData(snapshot.val());
                } else {
                    setUserDataLoading(false);
                    set(userRef, {
                        name: userName,
                        wins: 0,
                        losses: 0,
                    })
                }
            })

        setPage('selectOption');
    };

    const joinGame = () => {
        if (!userData) return;
        setPage('joinGame');
        setGameLoading(true);
        const gameRef = ref(database, 'game/');
        get(child(ref(database), 'game/'))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    // console.log(snapshot.val());
                    const data: Game = snapshot.val();
                    switch (data.state) {
                        case 'waiting for players':
                            setGameMessage(
                                'Greetings player 1, waiting on player 2 to connect...'
                            );
                            set(gameRef, {
                                player1: userData.name,
                                player2: data.player2,
                                state: 'waiting on player 2',
                                board: data.board,
                                player1Turn: false,
                            });
                            setGameData(data);
                            setMyPlayerNumber(1);
                            setMyGameBoard(data.board);
                            setPage('setUpBoard');
                            // initializeGame();
                            break;
                        case 'waiting on player 2':
                            setGameMessage('Greetings player 2');
                            set(gameRef, {
                                ...data,
                                player2: userData.name,
                                state: 'in progress',
                                player1Turn: true,
                            });
                            setMyPlayerNumber(2);
                            setGameData(data);
                            setMyGameBoard(data.board);
                            setPage('setUpBoard');
                            // initializeGame();
                            break;
                        default:
                            console.error('unknown state received from server');
                            break;
                    }
                } else {
                    // console.log('game does not exist');
                }
            })
            .catch((err) => console.error(err));
        setGameLoading(false);
    };

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
        onValue(ref(database, 'game'), (snapshot) => {
            const data: Game = snapshot.val();
            // console.log('received change from server');
            // console.log(data);
            if (data.state === 'in progress')
                setGameMessage(`Game: ${data.player1} vs ${data.player2}`);
            setGameData(data);
        });
    };

    const spectateGame = () => {};

    const sendSelection = (row: number, col: number) => {
        if (!gameData || !userData) return;
        let tempGameBoard = null;
        if (myPlayerNumber === 1) {
            tempGameBoard = gameData.player2Board;
            tempGameBoard[row][col] = 'X';
        } else {
            tempGameBoard = gameData.player1Board;
            tempGameBoard[row][col] = 'X';
        }
        if (tempGameBoard === null) return;
        if (myPlayerNumber === 1) {
            // console.log('I am player 1');
            // console.log('Sending change to player 2 board');
            setGameData({
                ...gameData,
                player2Board: tempGameBoard,
            });
        } else {
            // console.log('I am player 2');
            // console.log('Sending change to player 1 board');
            setGameData({
                ...gameData,
                player1Board: tempGameBoard,
            });
        }
        set(ref(database, 'game/'), gameData);
    };

    const handleClick = (row: number, col: number) => {
        if (!userData || !gameData) return;
        sendSelection(row, col);
    };

    // console.log(gameData)

    return (
        <div className='relative h-screen w-full bg-zinc-900 pt-10 pb-2 px-2 overflow-hidden'>
            {userData && (
                <div className='absolute left-4 top-2 flex flex-row'>
                    <p className='text-white/90 text-xl bg-zinc-800 rounded-xl px-2 hover:text-white mr-4 transition'>
                        User: {userData?.name}
                    </p>
                    <p className='text-white/90 text-xl bg-zinc-800 rounded-xl px-2 hover:text-white mr-4 transition'>
                        Wins: {userData?.wins}
                    </p>
                    <p className='text-white/90 text-xl bg-zinc-800 rounded-xl px-2 hover:text-white mr-4 transition'>
                        Losses: {userData?.losses}
                    </p>
                </div>
            )}
            {userData && (
                <button
                    className='absolute right-4 top-2 bg-zinc-800 hover:bg-zinc-700 transition px-2 rounded-xl text-white/90 hover:text-white text-xl active:bg-zinc-800'
                    onClick={() => {
                        setUserData(undefined);
                        setPage('login');
                        setUserNameInput('');
                    }}
                >
                    Logout
                </button>
            )}
            <div className='h-full w-full bg-slate-300 rounded-xl p-2'>
                <div className='text-xl text-center flex flex-col items-center h-full'>
                    <h1 className='text-4xl peer'>{title}</h1>
                    {page === 'login' && (
                        <form
                            className='text-xl text-center flex flex-col items-center'
                            onSubmit={(e) => {
                                e.preventDefault();
                                loginOrRegister(userNameInput);
                            }}
                        >
                            <input
                                type='text'
                                placeholder='User Name'
                                className='rounded-xl p-2 w-40 m-2 transition peer'
                                onChange={(e) =>
                                    setUserNameInput(e.target.value)
                                }
                                value={userNameInput}
                                required
                            />
                            {userNameInput && (
                                <button
                                    type="button"
                                    className='transition opacity-0 peer-valid:opacity-100 border-black/50 border-2 px-4 py-2 rounded-full active:bg-slate-400 hover:bg-slate-400/50 cursor-pointer'
                                    onClick={() =>
                                        loginOrRegister(userNameInput)
                                    }
                                >
                                    Login/Register
                                </button>
                            )}
                        </form>
                    )}
                    {page === 'selectOption' && (
                        <div>
                            {userDataLoading && (
                                <p className='text-3xl'>Loading...</p>
                            )}
                            {userData && (
                                <div className='flex flex-col mt-4'>
                                    <button
                                        className='border-black/50 border-2 px-4 py-2 m-2 rounded-full active:bg-slate-400 hover:bg-slate-400/50 select-none'
                                        onClick={() => joinGame()}
                                    >
                                        Join a game
                                    </button>
                                    <button
                                        className='border-black/50 border-2 px-4 py-2 m-2 rounded-full active:bg-slate-400 hover:bg-slate-400/50 select-none'
                                        onClick={() => spectateGame()}
                                    >
                                        Spectate
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {page === 'joinGame' && (
                        <div>
                            {gameLoading && (
                                <p className='text-3xl'>Loading game data...</p>
                            )}
                            {!gameLoading && (
                                <p className='text-3xl'>{gameMessage}</p>
                            )}
                        </div>
                    )}
                    {page === 'setUpBoard' && myGameBoard && (
                        <div className='flex flex-col h-[calc(100%-2em)]'>
                            <p className='text-3xl'>
                                Time to set up your board!
                            </p>
                            <p className='text-xl'>
                                Enter the start/end coordinates for each ship
                                below:
                            </p>
                            <div className='flex flex-col h-[calc(100%-5em)]'>
                                <div>
                                    <Board
                                        board={myGameBoard}
                                        handleClick={() => {}}
                                        editable={false}
                                    />
                                </div>
                                <div className='flex flex-col flex-1 overflow-auto items-center'>
                                    <ShipInput
                                        name='carrier'
                                        ships={ships}
                                        setShips={setShips}
                                        valid={shipsValid.carrier}
                                        setValid={(valid: boolean) =>
                                            setShipsValid({
                                                ...shipsValid,
                                                carrier: valid,
                                            })
                                        }
                                        myGameBoard={myGameBoard}
                                    />
                                    <ShipInput
                                        name='battleship'
                                        ships={ships}
                                        setShips={setShips}
                                        valid={shipsValid.battleship}
                                        setValid={(valid: boolean) =>
                                            setShipsValid({
                                                ...shipsValid,
                                                battleship: valid,
                                            })
                                        }
                                        myGameBoard={myGameBoard}
                                    />
                                    <ShipInput
                                        name='destroyer'
                                        ships={ships}
                                        setShips={setShips}
                                        valid={shipsValid.destroyer}
                                        setValid={(valid: boolean) =>
                                            setShipsValid({
                                                ...shipsValid,
                                                destroyer: valid,
                                            })
                                        }
                                        myGameBoard={myGameBoard}
                                    />
                                    <ShipInput
                                        name='submarine'
                                        ships={ships}
                                        setShips={setShips}
                                        valid={shipsValid.submarine}
                                        setValid={(valid: boolean) =>
                                            setShipsValid({
                                                ...shipsValid,
                                                submarine: valid,
                                            })
                                        }
                                        myGameBoard={myGameBoard}
                                    />
                                    <ShipInput
                                        name='patrol'
                                        ships={ships}
                                        setShips={setShips}
                                        valid={shipsValid.patrol}
                                        setValid={(valid: boolean) =>
                                            setShipsValid({
                                                ...shipsValid,
                                                patrol: valid,
                                            })
                                        }
                                        myGameBoard={myGameBoard}
                                    />
                                    {allShipsValid && (
                                        <button
                                            className='text-3xl border-2 border-black rounded-xl p-8 w-full hover:bg-black/5 max-w-xl'
                                            onClick={() => sendShipPlacements()}
                                        >
                                            Proceed
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {page === 'playGame' && (
                        <div>
                            <p className='text-3xl'>{gameMessage}</p>
                            {
                                <div>
                                    <div>
                                        <p>Player 1: {gameData?.player1}</p>
                                        <Board
                                            board={gameData?.player1Board || []}
                                            handleClick={handleClick}
                                            editable={myPlayerNumber !== 1}
                                        />
                                    </div>
                                    <div>
                                        <p>Player 2: {gameData?.player2}</p>
                                        <Board
                                            board={gameData?.player2Board || []}
                                            handleClick={handleClick}
                                            editable={myPlayerNumber !== 2}
                                        />
                                    </div>
                                </div>
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const Board = ({
    board,
    handleClick,
    editable,
}: {
    board: Array<Array<string>>;
    handleClick: (i: number, j: number) => void;
    editable: boolean;
}) => {
    // console.log(board)
    return (
        <table className='table-fixed border-collapse w-full h-full'>
            <thead>
                <tr>
                    {Array.from(' ABCDEFGHIJ').map((letter) => (
                        <th key={letter} className='border border-slate-600'>
                            {letter}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {board.map((row, i) => {
                    return (
                        <tr key={i}>
                            <td className='border border-slate-600 font-bold text-center'>
                                {i + 1}
                            </td>
                            {row.map((col, j) => {
                                // console.log(`location at ${i}${j}: ${board[i][j]}`)
                                return (
                                    <td
                                        key={`${i}${j}`}
                                        className='border border-slate-600 text-center hover:bg-slate-700 hover:text-white cursor-pointer select-none'
                                        onClick={() => {
                                            if (editable) handleClick(i, j);
                                        }}
                                    >
                                        {editable
                                            ? board[i][j] !== '?'
                                                ? board[i][j]
                                                : ' '
                                            : board[i][j]}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

const ShipInput = ({
    name,
    ships,
    setShips,
    valid,
    setValid,
    myGameBoard
}: {
    name: keyof Ships;
    ships: Ships;
    setShips: (ships: Ships) => void;
    valid: boolean;
    setValid: (valid: boolean) => void;
    myGameBoard: string[][]
}) => {
    interface Coordinates {
        startNum: number,
        endNum: number,
        startChar: string,
        endChar: string,
    }

    const [inputCheckStatus, setInputCheckStatus] = useState('');
    const [coordinates, setCoordinates] = useState<Coordinates>()

    const checkIsValid = () => {
        const start = ships[name].start;
        const end = ships[name].end;
        if (start.length < 2 || end.length < 2) {
            setValid(false);
            setInputCheckStatus('Need both start and end');
            return;
        }
        const startNum = Number(
            String(start.charAt(1)) + String(start.charAt(2))
        );
        const endNum = Number(String(end.charAt(1)) + String(end.charAt(2)));
        const startChar = start.charAt(0);
        const endChar = end.charAt(0);
        console.log({ startNum, startChar, endNum, endChar });
        setCoordinates({ startNum, startChar, endNum, endChar })
        if (startChar === endChar) {
            // same letter = column
            checkDistance(endNum - startNum + 1, name);
        } else if (startNum === endNum) {
            // same number = row
            const distance =
                Number(end.charCodeAt(0)) - Number(start.charCodeAt(0)) + 1; // add one because indexing starts at 1
            checkDistance(distance, name);
        } else {
            setValid(false);
            setInputCheckStatus('Incorrect format (ex: A1)');
        }
    };
    const shipDistances: ShipDistances = {
        carrier: 5,
        battleship: 4,
        destroyer: 3,
        submarine: 3,
        patrol: 2,
    };

    const checkDistance = (distance: number, shipClass: keyof Ships) => {
        const shipDistances: ShipDistances = {
            carrier: 5,
            battleship: 4,
            destroyer: 3,
            submarine: 3,
            patrol: 2,
        };
        const acceptedDistance: number = shipDistances[shipClass] || -1;
        if (distance === acceptedDistance) {
            if (!checkIfOverlapExists()) {
                setValid(true);
                setInputCheckStatus('Looks good!');
            } else {
                setInputCheckStatus('There\'s already a ship there!');
            }
        } else if (distance < acceptedDistance) {
            setValid(false);
            setInputCheckStatus('Not enough space!');
        } else if (distance > acceptedDistance) {
            setValid(false);
            setInputCheckStatus('Too much space!');
        }
    };

    const checkIfOverlapExists = () => {
        // console.log("overlap:")
        // console.log(ships)
        if (coordinates) {
            console.log("coordinates:")
            const startCol = Number(coordinates.startChar.toUpperCase().charCodeAt(0)) - 65;
            const endCol = Number(coordinates.endChar.toUpperCase().charCodeAt(0)) - 65;
            const startRow = coordinates.startNum - 1;
            const endRow = coordinates.endNum - 1;
            // console.log({
            //     start: [startRow, startCol],
            //     end: [endRow, endCol]
            // })

            // console.log(myGameBoard)

            for (let i = startRow; i <= endRow; i++) {
                for (let j = startCol; j <= endCol; j++) {
                    if (myGameBoard[i][j] !== ' ') {
                        // console.log(`This space is already taken: ${i}, ${j} is ${myGameBoard[i][j]}`)
                        return true;
                    }
                }
            }
            return false;
        } else {
            return true;
        }
    }

    const borderStyles = {
        carrier: 'border-2 border-teal-700 w-80 rounded-xl p-2 m-2',
        battleship: 'border-2 border-red-700 w-80 rounded-xl p-2 m-2',
        destroyer: 'border-2 border-amber-700 w-80 rounded-xl p-2 m-2',
        submarine: 'border-2 border-lime-700 w-80 rounded-xl p-2 m-2',
        patrol: 'border-2 border-rose-700 w-80 rounded-xl p-2 m-2',
    };

    return (
        <div className={borderStyles[name]}>
            <p>{`${name.charAt(0).toUpperCase()}${name.slice(1)} (${
                shipDistances[name]
            })`}</p>
            <p>{inputCheckStatus}</p>
            <input
                type='text'
                placeholder='Start Position'
                value={ships[name].start}
                onChange={(e) => {
                    setShips({
                        ...ships,
                        [name]: {
                            start: e.target.value.toUpperCase(),
                            end: ships[name].end,
                        },
                    });
                }}
                onBlur={() => checkIsValid()}
            />
            <input
                type='text'
                placeholder='End Position'
                value={ships[name].end}
                onChange={(e) => {
                    setShips({
                        ...ships,
                        [name]: {
                            start: ships[name].start,
                            end: e.target.value.toUpperCase(),
                        },
                    });
                }}
                onBlur={() => checkIsValid()}
            />
        </div>
    );
};

export default App;
