import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import FacebookLogin from 'react-facebook-login';
import 'bootstrap/dist/css/bootstrap.min.css';


function Square({ value, onClick }) {
    return (
        <button
            className="square"
            onClick={onClick}
        >
            {value}
        </button>
    );
}

function calculateWinner(squares, submitScore) {
    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ]

    for (let i = 0; i < winningCombinations.length; i++) {
        const [a, b, c] = winningCombinations[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}

class Board extends React.Component {

    renderSquare(i) {
        return (
            <Square
                value={this.props.squares[i]}
                onClick={() => this.props.onClick(i)}
            />
        );
    }

    render() {
        return (
            <div>
                <div className="board-row">
                    {this.renderSquare(0)}
                    {this.renderSquare(1)}
                    {this.renderSquare(2)}
                </div>
                <div className="board-row">
                    {this.renderSquare(3)}
                    {this.renderSquare(4)}
                    {this.renderSquare(5)}
                </div>
                <div className="board-row">
                    {this.renderSquare(6)}
                    {this.renderSquare(7)}
                    {this.renderSquare(8)}
                </div>
            </div >
        );
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [
                {
                    squares: Array(9).fill(null)
                }
            ],
            stepNumber: 0,
            xIsNext: true,
            isLogin: false,
            score: 0,
            userName: "",
            highScore: [],
        }
    }

    componentDidMount() {
        this.highScore()
    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();

        if (history.length === 1) {
            this.timerFunction = setInterval(() => this.setState({ score: this.state.score + 1 }), 1000)
        }

        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        squares[i] = this.state.xIsNext ? "X" : "O";
        this.setState({
            history: history.concat([
                {
                    squares: squares
                }
            ]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext,
        })
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0,
        })
    }

    responseFacebook = (response) => {
        this.setState({
            isLogin: true,
            userName: response.name,
        })
    }

    async submitScore() {
        let data = new URLSearchParams();
        data.append('player', this.state.userName);
        data.append('score', this.state.score);
        const url = `http://ftw-highscores.herokuapp.com/tictactoe-dev?reverse=true`;
        const response = await fetch(url,
            {
                method: 'POST',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: data.toString(),
                json: true,
            }
        );
    }

    async highScore() {
        const results = await fetch(`http://ftw-highscores.herokuapp.com/tictactoe-dev?reverse=true`)
        const jsData = await results.json()

        this.setState({ highScore: jsData.items })
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares);

        const moves = history.map((step, move) => {
            const desc = move ?
                `Go to move #${move}` :
                `Go to game start`;
            return (
                <li key={move}>
                    <button onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            )
        })

        let status;
        let submitPrompt;
        if (winner) {
            this.submitScore()
            status = `Winner: ${winner}`
            submitPrompt = `Your score = ${this.state.score} has been submitted`
            clearTimeout(this.timerFunction)
        } else if (current.squares.includes(null) === true) {
            status = `Next player: ${this.state.xIsNext ? "X" : "O"}`
        } else if (current.squares.includes(null) === false) {
            this.submitScore()
            status = "Draw"
            submitPrompt = `Your score = ${this.state.score} has been submitted`
        }

        return (
            !this.state.isLogin ?
                <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                    <FacebookLogin
                        appId="331778040830658"
                        // autoLoad={true}
                        fields="name,email,picture"
                        callback={this.responseFacebook}
                    />
                </div>
                :
                (
                    <div className="container my-5">
                        <div className="row">
                            <div className="col d-flex justify-content-center">
                                <h1 style={{ fontSize: 20, color: "red" }}>{submitPrompt}</h1>
                            </div>
                        </div>
                        <div className="row mt-5">
                            <div className="col d-flex justify-content-center">
                                <Board
                                    squares={current.squares}
                                    onClick={(i) => this.handleClick(i)}
                                />
                            </div>
                        </div>
                        <div className="row mt-5">
                            <div className="col-12 col-sm-6">
                                <p>
                                    Your score will be automatically submitted when the game finished (win, lose, or draw)
                                </p>
                                <div>Player: {this.state.userName}</div>
                                <div>{status}</div>
                                <div>
                                    Score: {this.state.score}
                                </div>
                                <ol>{moves}</ol>
                            </div>
                            <div className="col-12 col-sm-6">
                                <p>Leaderboard:</p>
                                <ul>
                                    {
                                        this.state.highScore.map(item => {
                                            return <li key={item._id}>{item.player} scored {item.score}</li>
                                        })
                                    }
                                </ul>
                            </div>
                        </div>
                    </div>
                )
        )
    }

}

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);