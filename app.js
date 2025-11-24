const defaultChampions = [
  {
    edition: 1,
    name: 'Mateus',
    type: 'soldier',
    desc: 'Brigada Militar RS',
    emoji: '👮‍♂️',
  },
  {
    edition: 2,
    name: 'Fernando',
    type: 'dad',
    desc: 'Pai de 3 meninas (Haja coluna!)',
    emoji: '👨‍👧‍👧',
  },
  {
    edition: 3,
    name: 'Miguel',
    type: 'cyborg',
    desc: 'O Exterminador de Picanha',
    emoji: '🤖',
  },
];

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
                    <button class="btn btn-secondary" hx-get="/nova-edicao" hx-target="#main-content" hx-swap="innerHTML">
                        Nova Edição
                    </button>
                </div>
            `;
    } else if (path === '/campeoes') {
      const champs = getData();
      let listHTML = champs
        .map(
          (c) => `
                <div class="champion-card">
                    <div class="avatar ${c.type}">
                        ${c.emoji}
                    </div>
                    <div class="info">
                        <h3>${c.edition}ª Edição: ${c.name}</h3>
                        <p>${c.desc}</p>
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
    } else if (path === '/nova-edicao') {
      responseHTML = `
                <h2>🆕 Nova Edição</h2>
                <form hx-post="/salvar" hx-target="#main-content">
                    <label>Nome do Campeão:</label>
                    <input type="text" name="name" required placeholder="Ex: Cleber">
                    
                    <label>Descrição (O Personagem):</label>
                    <input type="text" name="desc" required placeholder="Ex: O Rei do Gole">
                    
                    <label>Tipo de Avatar:</label>
                    <select name="type">
                        <option value="soldier">Militar</option>
                        <option value="dad">Pai de Família</option>
                        <option value="cyborg">Ciborgue</option>
                        <option value="moneyMan">Homem do Money</option>
                        <option value="dadNew">Pai Fresco</option>
                        <option value="oldBoat">Véio da Lancha</option>
                        <option value="other">Outro</option>
                    </select>

                    <button type="submit" class="btn">Salvar Campeão</button>
                    <button class="btn btn-secondary" hx-get="/home" hx-target="#main-content">Cancelar</button>
                </form>
            `;
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
          (c) => `
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
