const tamanhoLabirinto = 40;
let tamanhoCelula;
let blocos = [];
let resolvendo = false;
let pausado = false;
let cancelarResolucao = false;
let atraso = 80;
let modoLento = true;

const canvas = document.getElementById("telaLabirinto");
const ctx = canvas.getContext("2d");
const botaoGerar = document.getElementById("botaoGerar");
const botaoResolver = document.getElementById("botaoResolver");
const botaoVelocidade = document.getElementById("botaoVelocidade");
const mensagem = document.getElementById("mensagem");

botaoVelocidade.addEventListener("click", () => {
    modoLento = !modoLento;
    atraso = modoLento ? 80 : 40;
    botaoVelocidade.textContent = `Velocidade: ${modoLento ? "Lenta" : "Normal"
        }`;
});

function ajustarCanvas() {
    const margem = 100;
    const dim = Math.min(window.innerWidth, window.innerHeight - margem);
    tamanhoCelula = Math.floor(dim / tamanhoLabirinto);
    canvas.width = tamanhoCelula * tamanhoLabirinto;
    canvas.height = tamanhoCelula * tamanhoLabirinto;
}

window.addEventListener("resize", () => {
    ajustarCanvas();
    desenharLabirinto();
});

function initBlocos() {
    blocos = Array.from({ length: tamanhoLabirinto }, () =>
        Array(tamanhoLabirinto).fill(true)
    );
}

function gerarLabirinto() {
    cancelarResolucao = true;
    resolvendo = false;
    pausado = false;
    mensagem.textContent = "";
    botaoResolver.textContent = "Resolver Labirinto";
    initBlocos();
    escavar(0, 0);
    blocos[0][0] = false;
    blocos[tamanhoLabirinto - 1][tamanhoLabirinto - 1] = false;
    blocos[tamanhoLabirinto - 2][tamanhoLabirinto - 1] = false;
    blocos[tamanhoLabirinto - 1][tamanhoLabirinto - 2] = false;
    desenharLabirinto();
}

function escavar(x, y) {
    blocos[x][y] = false;
    const direcoes = shuffle([
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
    ]);
    for (const [dx, dy] of direcoes) {
        const nx = x + dx * 2;
        const ny = y + dy * 2;
        if (
            nx >= 0 &&
            nx < tamanhoLabirinto &&
            ny >= 0 &&
            ny < tamanhoLabirinto &&
            blocos[nx][ny]
        ) {
            blocos[x + dx][y + dy] = false;
            escavar(nx, ny);
        }
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function desenharLabirinto(
    trilhaVisitados = new Set(),
    trilhaBacktrack = new Set(),
    personagem = null
) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < tamanhoLabirinto; x++) {
        for (let y = 0; y < tamanhoLabirinto; y++) {
            ctx.fillStyle = blocos[x][y] ? "#222" : "#ccc";
            ctx.fillRect(
                x * tamanhoCelula,
                y * tamanhoCelula,
                tamanhoCelula,
                tamanhoCelula
            );
        }
    }

    trilhaVisitados.forEach((chave) => {
        const [x, y] = chave.split(",").map(Number);
        ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
        ctx.fillRect(
            x * tamanhoCelula,
            y * tamanhoCelula,
            tamanhoCelula,
            tamanhoCelula
        );
    });

    trilhaBacktrack.forEach((chave) => {
        const [x, y] = chave.split(",").map(Number);
        ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
        ctx.fillRect(
            x * tamanhoCelula,
            y * tamanhoCelula,
            tamanhoCelula,
            tamanhoCelula
        );
    });

    if (personagem) {
        const [x, y] = personagem;
        ctx.fillStyle = "blue";
        ctx.fillRect(
            x * tamanhoCelula,
            y * tamanhoCelula,
            tamanhoCelula,
            tamanhoCelula
        );
    }

    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, tamanhoCelula, tamanhoCelula);
    ctx.fillStyle = "red";
    ctx.fillRect(
        (tamanhoLabirinto - 1) * tamanhoCelula,
        (tamanhoLabirinto - 1) * tamanhoCelula,
        tamanhoCelula,
        tamanhoCelula
    );
}

async function resolverLabirinto() {
    cancelarResolucao = false;
    const stack = [[0, 0]];
    const visitados = new Set();
    const caminho = new Set();
    const backtrack = new Set();

    resolvendo = true;
    pausado = false;
    mensagem.textContent = "";

    while (stack.length > 0) {
        if (cancelarResolucao) {
            mensagem.textContent = "Resolução cancelada";
            resolvendo = false;
            botaoResolver.textContent = "Resolver Labirinto";
            return;
        }

        if (pausado) {
            await new Promise((r) => setTimeout(r, 100));
            continue;
        }

        const [x, y] = stack[stack.length - 1];
        const chave = `${x},${y}`;

        caminho.add(chave);
        visitados.add(chave);

        desenharLabirinto(visitados, backtrack, [x, y]);

        if (x === tamanhoLabirinto - 1 && y === tamanhoLabirinto - 1) {
            mensagem.textContent = "Labirinto resolvido!";
            resolvendo = false;
            botaoResolver.textContent = "Resolver Labirinto";
            return;
        }

        await new Promise((r) => setTimeout(r, atraso));

        const vizinhos = [
            [1, 0],
            [-1, 0],
            [0, -1],
            [0, 1],
        ]
            .map(([dx, dy]) => [x + dx, y + dy])
            .filter(
                ([nx, ny]) =>
                    nx >= 0 &&
                    ny >= 0 &&
                    nx < tamanhoLabirinto &&
                    ny < tamanhoLabirinto
            )
            .filter(
                ([nx, ny]) => !blocos[nx][ny] && !visitados.has(`${nx},${ny}`)
            );

        if (vizinhos.length > 0) {
            stack.push(vizinhos[0]);
        } else {
            const removido = stack.pop();
            const chaveRemovido = `${removido[0]},${removido[1]}`;
            backtrack.add(chaveRemovido);
        }
    }

    mensagem.textContent = "Resolução interrompida ou sem solução";
    resolvendo = false;
    botaoResolver.textContent = "Resolver Labirinto";
}

botaoGerar.addEventListener("click", () => {
    cancelarResolucao = true;
    resolvendo = false;
    pausado = false;
    mensagem.textContent = "";
    botaoResolver.textContent = "Resolver Labirinto";
    gerarLabirinto();
});

botaoResolver.addEventListener("click", () => {
    if (!resolvendo) {
        botaoResolver.textContent = "Pausar";
        resolverLabirinto();
    } else {
        pausado = !pausado;
        botaoResolver.textContent = pausado ? "Despausar" : "Pausar";
    }
});

window.onload = () => {
    ajustarCanvas();
    gerarLabirinto();
};