const defaultChampions = [
    {
        edition: 1,
        name: 'Mateus',
        type: 'soldier',
        desc: 'Brigada Militar RS',
        ano: '2023/11',
        emoji: '👮‍♂️',
    },
    {
        edition: 2,
        name: 'Fernando',
        type: 'dad',
        desc: 'Pai de 3 meninas (Haja coluna!)',
        ano: '2025/03',
        emoji: '👨‍👧‍👧',
    },
    {
        edition: 3,
        name: 'Miguel',
        type: 'cyborg',
        desc: 'O Exterminador de Picanha',
        ano: '2025/11',
        emoji: '🤖',
    },
];

let currentLeague = {
    players: [],
    matches: [],
};

function getData() {
    const data = localStorage.getItem('fifa_churras_db');
    return data ? JSON.parse(data) : defaultChampions;
}

function saveData(newData) {
    localStorage.setItem('fifa_churras_db', JSON.stringify(newData));
}

document.body.addEventListener('htmx:beforeRequest', function (evt) {
    evt.preventDefault();

    const path = evt.detail.requestConfig.path;
    const target = evt.detail.elt;
    const targetId = evt.detail.target;

    setTimeout(() => {
        let responseHTML = '';

        if (path === '/home') {
            responseHTML = `
                <div class="scene">
                    <div class="trophy">
                        <div class="ball"></div>

                        <div class="cup-bowl bowl-front gold-gradient"></div>
                        <div class="cup-bowl bowl-back gold-gradient"></div>

                        <div class="cup-stem gold-gradient"></div>

                        <div class="base-top"></div> <div class="cup-base base-front gold-gradient"></div>
                        <div class="cup-base base-back gold-gradient"></div>
                    </div>
                </div>
                
                <div class="actions">
                    <button class="btn" hx-get="/campeoes" hx-target="#main-content" hx-swap="innerHTML">
                        Ver Campeões
                    </button>
                    <button class="btn btn-secondary" hx-get="/criar-copa" hx-target="#main-content">🏆 Criar Copa</button>
                    <!-- <button class="btn btn-secondary" hx-get="/nova-edicao" hx-target="#main-content" hx-swap="innerHTML"> -->
                      <!--    Nova Edição -->
                    <!--  </button> -->
                </div>
            `;
        } else if (path === '/campeoes') {
            const champs = getData();
            let listHTML = champs
                .map(
                    c => `
                <div class="champion-card">
                    <div class="avatar ${c.type}">
                        ${c.emoji}
                    </div>
                    <div class="info">
                        <h3>${c.edition}ª Edição: ${c.name}</h3>
                        <p>${c.desc}</p>
                        <p>${c.ano}</p>
                    </div>
                </div>
            `
                )
                .join('');

            responseHTML = `
                <h2>🏆 Hall da Fama</h2>
                <div class="list">${listHTML}</div>
                <button class="btn" hx-get="/home" hx-target="#main-content">Voltar</button>
            `;
        } else if (path === '/criar-copa') {
            responseHTML = `
                <h2>⚽ Configurar Nova Copa</h2>
                <p>Digite o nome dos jogadores (um por linha):</p>
                <form hx-post="/iniciar-liga" hx-target="#main-content" class="setup-area">
                    <textarea name="players" required placeholder="Ex:
Lucas
Pedro
João
Davi"></textarea>
                    <br>
                    <button class="btn">Gerar Tabela de Jogos</button>
                    <button class="btn btn-secondary" hx-get="/home" hx-target="#main-content">Cancelar</button>
                </form>
            `;
        } else if (path === '/iniciar-liga') {
            const form = document.querySelector('form');
            const rawText = new FormData(form).get('players');
            const players = rawText
                .split('\n')
                .map(n => n.trim())
                .filter(n => n !== '');

            if (players.length < 3) {
                responseHTML = `<h3 style="color:red">Mínimo 3 jogadores!</h3><button class="btn" hx-get="/criar-copa" hx-target="#main-content">Voltar</button>`;
            } else {
                currentLeague.players = players;
                currentLeague.matches = [];

                for (let i = 0; i < players.length; i++) {
                    for (let j = i + 1; j < players.length; j++) {
                        currentLeague.matches.push({ id: `${i}-${j}`, p1: players[i], p2: players[j] });
                    }
                }

                let matchesHTML = currentLeague.matches
                    .map(
                        (m, index) => `
                    <div class="match-card">
                        <div class="match-players">
                            <span>${m.p1}</span> <span>X</span> <span>${m.p2}</span>
                        </div>
                        <div class="match-inputs" style="justify-content: center;">
                            <input type="number" name="score1_${index}" placeholder="0" style="width:50px; text-align:center;" min="0">
                            <span style="font-size:1.5rem; margin:0 10px;">X</span>
                            <input type="number" name="score2_${index}" placeholder="0" style="width:50px; text-align:center;" min="0">
                        </div>
                    </div>
                `
                    )
                    .join('');

                responseHTML = `
                    <h2>⚔️ Fase de Grupos</h2>
                    <p>Digite o placar dos jogos (deixe em branco se for 0x0 ou não jogou ainda):</p>
                    <form hx-post="/calcular-final" hx-target="#main-content">
                        ${matchesHTML}
                        <button class="btn">📊 Calcular Finalistas</button>
                    </form>
                `;
            }
        } else if (path === '/calcular-final') {
            const form = document.querySelector('form');
            let scoreboard = {};
            currentLeague.players.forEach(p => (scoreboard[p] = { name: p, points: 0, balance: 0, goals: 0 }));

            currentLeague.matches.forEach((m, index) => {
                const s1Input = form.querySelector(`[name="score1_${index}"]`);
                const s2Input = form.querySelector(`[name="score2_${index}"]`);

                // Se o campo estiver vazio, considera 0
                const s1 = s1Input.value ? parseInt(s1Input.value) : 0;
                const s2 = s2Input.value ? parseInt(s2Input.value) : 0;

                // Atualiza gols pró (critério de desempate extra se quiser)
                scoreboard[m.p1].goals += s1;
                scoreboard[m.p2].goals += s2;

                if (s1 > s2) {
                    // P1 Venceu
                    scoreboard[m.p1].points += 3;
                    scoreboard[m.p1].balance += s1 - s2;
                    scoreboard[m.p2].balance -= s1 - s2; // Perdedor perde saldo
                } else if (s2 > s1) {
                    // P2 Venceu
                    scoreboard[m.p2].points += 3;
                    scoreboard[m.p2].balance += s2 - s1;
                    scoreboard[m.p1].balance -= s2 - s1;
                } else {
                    // Empate
                    scoreboard[m.p1].points += 1;
                    scoreboard[m.p2].points += 1;
                    // Saldo não muda no empate
                }
            });

            // Ordenar: 1º Pontos, 2º Saldo, 3º Gols Pró
            const ranking = Object.values(scoreboard).sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.balance !== a.balance) return b.balance - a.balance;
                return b.goals - a.goals;
            });

            const finalist1 = ranking[0];
            const finalist2 = ranking[1];

            responseHTML = `
                <h2>🔥 A GRANDE FINAL 🔥</h2>
                <div class="final-card">
                    <h3 style="color:var(--yellow); text-align:center;">${finalist1.name} VS ${finalist2.name}</h3>
                </div>

                <h3>Classificação Geral:</h3>
                <ul style="text-align:left; background:#333; padding:10px;">
                    ${ranking
                        .map(
                            (r, i) =>
                                `<li>${i + 1}º ${r.name} | Pts: ${r.points} | SG: ${r.balance} | GP: ${r.goals}</li>`
                        )
                        .join('')}
                </ul>

                <form hx-post="/consagrar-campeao" hx-target="#main-content">
                    <label>Quem venceu a final?</label>
                    <select name="champion_name">
                        <option value="${finalist1.name}">${finalist1.name}</option>
                        <option value="${finalist2.name}">${finalist2.name}</option>
                    </select>
                    <button class="btn">🏆 Entregar Taça</button>
                </form>
            `;
        } else if (path === '/consagrar-campeao') {
            const form = document.querySelector('form');
            const formData = new FormData(form);
            const name = formData.get('champion_name');

            const currentData = getData();
            currentData.push({
                edition: currentData.length + 1,
                name: name,
                type: 'soldier',
                desc: 'Campeão da Copa (Mata-mata)',
                emoji: '🥇',
                ano: `${new Date().toISOString().split('T')[0].split('-')[0]}/${
                    new Date().toISOString().split('T')[0].split('-')[1]
                }`,
            });
            saveData(currentData);

            responseHTML = `
                <h1>🎉 TEMOS UM CAMPEÃO!</h1>
                <h2 style="color:var(--yellow)">${name}</h2>
                <p>A taça foi entregue e o churrasco está pago.</p>
                <button class="btn" hx-get="/home" hx-target="#main-content">Voltar ao Início</button>
            `;
            // } else if (path === '/nova-edicao') {
            //   responseHTML = `
            //             <h2>🆕 Nova Edição</h2>
            //             <form hx-post="/salvar" hx-target="#main-content">
            //                 <label>Nome do Campeão:</label>
            //                 <input type="text" name="name" required placeholder="Ex: Cleber">

            //                 <label>Descrição (O Personagem):</label>
            //                 <input type="text" name="desc" required placeholder="Ex: O Rei do Gole">

            //                 <label>Ano e Mês (Aproximado):</label>
            //                 <input type="text" name="desc" required placeholder="Ex: 2025/05">

            //                 <label>Tipo de Avatar:</label>
            //                 <select name="type">
            //                     <option value="soldier">Militar</option>
            //                     <option value="dad">Pai de Família</option>
            //                     <option value="cyborg">Ciborgue</option>
            //                     <option value="moneyMan">Homem do Money</option>
            //                     <option value="dadNew">Pai Fresco</option>
            //                     <option value="oldBoat">Véio da Lancha</option>
            //                     <option value="other">Outro</option>
            //                 </select>

            //                 <button type="submit" class="btn">Salvar Campeão</button>
            //                 <button class="btn btn-secondary" hx-get="/home" hx-target="#main-content">Cancelar</button>
            //             </form>
            //         `;
        } else if (path === '/salvar') {
            const form = document.querySelector('form');
            const formData = new FormData(form);

            const currentData = getData();
            const newChamp = {
                edition: currentData.length + 1,
                name: formData.get('name'),
                type: formData.get('type'),
                desc: formData.get('desc'),
                emoji: '🏆',
                ano: `${new Date().toISOString().split('T')[0].split('-')[0]}/${
                    new Date().toISOString().split('T')[0].split('-')[1]
                }`,
            };

            if (newChamp.type === 'soldier') newChamp.emoji = '👮‍♂️';
            if (newChamp.type === 'dad') newChamp.emoji = '👨‍👧';
            if (newChamp.type === 'cyborg') newChamp.emoji = '🤖';
            if (newChamp.type === 'moneyMan') newChamp.emoji = '🤑';
            if (newChamp.type === 'dadNew') newChamp.emoji = '👨🏼‍🍼';
            if (newChamp.type === 'oldBoat') newChamp.emoji = '🛥️';

            currentData.push(newChamp);
            saveData(currentData);

            document.body.dispatchEvent(new CustomEvent('htmx:abort'));
            htmx.trigger('#main-content', 'update-list');

            const champs = currentData;
            let listHTML = champs
                .map(
                    c => `
                <div class="champion-card">
                    <div class="avatar ${c.type}">${c.emoji}</div>
                    <div class="info"><h3>${c.edition}ª Edição: ${c.name}</h3><p>${c.desc}</p></div>
                </div>
            `
                )
                .join('');

            responseHTML = `
                <h2>✅ Salvo com Sucesso!</h2>
                <div class="list">${listHTML}</div>
                <button class="btn" hx-get="/home" hx-target="#main-content">Voltar ao Início</button>
            `;
        }

        const targetElement = evt.detail.target || evt.detail.elt;
        targetElement.innerHTML = responseHTML;

        htmx.process(targetElement);
    }, 100);
});

window.addEventListener('DOMContentLoaded', () => {
    const mockEvent = {
        detail: { requestConfig: { path: '/home' }, target: '#main-content' },
        preventDefault: () => {},
    };

    htmx.ajax('GET', '/home', '#main-content');
});
