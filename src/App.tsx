import { useState } from "react";

function App() {
  const [ firstPlayerTurn, setFirstPlayerTurn ] = useState(true);
  const board:Array<Array<string>> = new Array(10)
  for (let i = 0; i < 10; i++) board[i] = new Array(10);
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      board[i][j] = '?';
    }
  }

  const handleClick = () => {

  }

  return (
    <div className="h-screen w-full bg-zinc-900 p-10">
      <div className="h-full w-full bg-slate-300 rounded-xl p-2">
        {firstPlayerTurn && <Board board={board} handleClick={handleClick} />}
        {!firstPlayerTurn && <Board board={board} handleClick={handleClick} />}
      </div>
    </div>
  )
}

const Board = (
  {board, handleClick}: 
  {board: Array<Array<string>>, handleClick: () => void}
) => {
  return (
    <table className="table-fixed border-collapse w-full h-full">
      <thead>
        <tr>
          {Array.from(" ABCDEFGHIJ").map(letter => <th className="border border-slate-600">{letter}</th>)}
        </tr>
      </thead>
      <tbody>
        {board.map((row, i, board) => {
          return (
            <tr>
              <td className="border border-slate-600 font-bold text-center">{i + 1}</td>
              {row.map((col, j, board) => {
                return <td key={`${i}${j}`} className="border border-slate-600 text-center hover:bg-slate-700 hover:text-white cursor-pointer select-none" onClick={() => handleClick}>{`${i}${j}`}</td>
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default App
