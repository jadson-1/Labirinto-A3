// Configurações iniciais do labirinto
const tamanhoLabirinto = 40; // Tamanho do labirinto (40x40 células)
let tamanhoCelula; // Tamanho de cada célula (calculado dinamicamente)
let blocos = []; // Matriz que representa as paredes do labirinto
let resolvendo = false; // Flag para controle de resolução em andamento
let pausado = false; // Flag para pausar a resolução
let cancelarResolucao = false; // Flag para cancelar a resolução
let atraso = 80; // Tempo de atraso entre passos (em ms)
let modoLento = true; // Controle de velocidade

// Elementos da interface
const canvas = document.getElementById("telaLabirinto");
const ctx = canvas.getContext("2d");
const botaoGerar = document.getElementById("botaoGerar");
const botaoResolver = document.getElementById("botaoResolver");
const botaoVelocidade = document.getElementById("botaoVelocidade");
const mensagem = document.getElementById("mensagem");

// Evento para alternar velocidade
botaoVelocidade.addEventListener("click", () => {
    modoLento = !modoLento;
    atraso = modoLento ? 80 : 40;
    botaoVelocidade.textContent = `Velocidade: ${modoLento ? "Lenta" : "Normal"}`;
});

// Ajusta o tamanho do canvas conforme a janela
function ajustarCanvas() {
    const margem = 100;
    const dim = Math.min(window.innerWidth, window.innerHeight - margem);
    tamanhoCelula = Math.floor(dim / tamanhoLabirinto);
    canvas.width = tamanhoCelula * tamanhoLabirinto;
    canvas.height = tamanhoCelula * tamanhoLabirinto;
}

// Redimensiona o canvas quando a janela muda de tamanho
window.addEventListener("resize", () => {
    ajustarCanvas();
    desenharLabirinto();
});

// Inicializa a matriz de blocos com paredes (todos valores true)
function initBlocos() {
    blocos = Array.from({ length: tamanhoLabirinto }, () =>
        Array(tamanhoLabirinto).fill(true)
    );
}

// Gera um novo labirinto usando algoritmo de escavação recursiva
function gerarLabirinto() {
    cancelarResolucao = true;
    resolvendo = false;
    pausado = false;
    mensagem.textContent = "";
    botaoResolver.textContent = "Resolver Labirinto";
    initBlocos();
    escavar(0, 0); // Começa a escavar a partir do canto superior esquerdo

    // Garante entrada e saída abertas
    blocos[0][0] = false; // Entrada
    blocos[tamanhoLabirinto - 1][tamanhoLabirinto - 1] = false;// Saída
    blocos[tamanhoLabirinto - 2][tamanhoLabirinto - 1] = false;// Abertura para saída
    blocos[tamanhoLabirinto - 1][tamanhoLabirinto - 2] = false;// Abertura para saída

    desenharLabirinto();
}

// Função recursiva para escavar o labirinto
function escavar(x, y) {
    blocos[x][y] = false; // Remove a parede na posição atual
    const direcoes = shuffle([ // Embaralha as direções
        [-1, 0], // Esquerda
        [0, 1],  // Baixo
        [1, 0],  // Direita
        [0, -1], // Cima
    ]);

    // Tenta escavar em cada direção
    for (const [dx, dy] of direcoes) {
        const nx = x + dx * 2; // Pula duas células
        const ny = y + dy * 2;

        // Verifica se está dentro dos limites e se a célula está bloqueada
        if (nx >= 0 && nx < tamanhoLabirinto &&
            ny >= 0 && ny < tamanhoLabirinto &&
            blocos[nx][ny]) {
            blocos[x + dx][y + dy] = false; // Remove parede entre as células
            escavar(nx, ny); // Recursão para continuar escavando
        }
    }
}

// Embaralha um array (Fisher-Yates)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Desenha o labirinto na tela
function desenharLabirinto(
    trilhaVisitados = new Set(), // Células visitadas (verde)
    trilhaBacktrack = new Set(), // Backtracking (vermelho)
    personagem = null            // Posição atual do "resolvedor" (azul)
) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha as paredes e caminhos
    for (let x = 0; x < tamanhoLabirinto; x++) {
        for (let y = 0; y < tamanhoLabirinto; y++) {
            ctx.fillStyle = blocos[x][y] ? "#222" : "#ccc"; // Parede ou caminho
            ctx.fillRect(
                x * tamanhoCelula,
                y * tamanhoCelula,
                tamanhoCelula,
                tamanhoCelula
            );
        }
    }

    // Desenha células visitadas
    trilhaVisitados.forEach((chave) => {
        const [x, y] = chave.split(",").map(Number);
        ctx.fillStyle = "rgba(0, 255, 0, 0.3)"; // Verde transparente
        ctx.fillRect(
            x * tamanhoCelula,
            y * tamanhoCelula,
            tamanhoCelula,
            tamanhoCelula
        );
    });

    // Desenha backtracking
    trilhaBacktrack.forEach((chave) => {
        const [x, y] = chave.split(",").map(Number);
        ctx.fillStyle = "rgba(255, 0, 0, 0.7)"; // Vermelho transparente
        ctx.fillRect(
            x * tamanhoCelula,
            y * tamanhoCelula,
            tamanhoCelula,
            tamanhoCelula
        );
    });

    // Desenha personagem (posição atual na resolução)
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

    // Marca início (verde) e fim (vermelho)
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

// Resolve o labirinto usando DFS (Depth-First Search)
async function resolverLabirinto() {
    cancelarResolucao = false;
    const stack = [[0, 0]]; // Pilha para DFS
    const visitados = new Set(); // Células visitadas
    const caminho = new Set(); // Caminho atual
    const backtrack = new Set(); // Células onde houve backtrack

    resolvendo = true; // Marca que está resolvendo
    pausado = false; // Marca que não está pausado
    mensagem.textContent = ""; // Limpa mensagem anterior

    // Limpa o canvas antes de começar a resolução
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

        // Obtém a posição atual do topo da pilha
        const [x, y] = stack[stack.length - 1];
        const chave = `${x},${y}`;

        // Se já visitou essa célula, continua para a próxima
        caminho.add(chave);
        visitados.add(chave);

        // Desenha o labirinto com a posição atual
        desenharLabirinto(visitados, backtrack, [x, y]);

        // Verifica se chegou ao final
        if (x === tamanhoLabirinto - 1 && y === tamanhoLabirinto - 1) {
            mensagem.textContent = "Labirinto resolvido!";
            resolvendo = false;
            botaoResolver.textContent = "Resolver Labirinto";
            return;
        }

        // Atraso para visualização
        await new Promise((r) => setTimeout(r, atraso));

        // Obtém vizinhos válidos
        const vizinhos = [
            [1, 0], [-1, 0], [0, -1], [0, 1] // Direita, Esquerda, Cima, Baixo
        ]
            .map(([dx, dy]) => [x + dx, y + dy])
            .filter(([nx, ny]) => // Filtra células dentro dos limites
                nx >= 0 && ny >= 0 && nx < tamanhoLabirinto && ny < tamanhoLabirinto
            )
            .filter(([nx, ny]) => // Filtra células abertas e não visitadas
                !blocos[nx][ny] && !visitados.has(`${nx},${ny}`)
            );

        if (vizinhos.length > 0) {
            stack.push(vizinhos[0]); // Avança para o próximo vizinho
        } else {
            const removido = stack.pop(); // Backtrack
            const chaveRemovido = `${removido[0]},${removido[1]}`;
            backtrack.add(chaveRemovido);
        }
    }
    // Se chegar aqui, não encontrou solução
    mensagem.textContent = "Resolução interrompida ou sem solução";
    resolvendo = false;
    botaoResolver.textContent = "Resolver Labirinto";
}

// Event listeners para os botões
botaoGerar.addEventListener("click", () => {
    cancelarResolucao = true;
    resolvendo = false;
    pausado = false;
    mensagem.textContent = "";
    botaoResolver.textContent = "Resolver Labirinto";
    gerarLabirinto();
});

// Botão para resolver o labirinto
botaoResolver.addEventListener("click", () => {
    if (!resolvendo) {
        botaoResolver.textContent = "Pausar";
        resolverLabirinto();
    } else {
        pausado = !pausado;
        botaoResolver.textContent = pausado ? "Despausar" : "Pausar";
    }
});

// Inicialização quando a página carrega
window.onload = () => {
    ajustarCanvas();
    gerarLabirinto();
};