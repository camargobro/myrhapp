const HOSTS_LOCAIS = ['localhost', '127.0.0.1'];
const servidoPeloBackend =
    location.protocol.startsWith('http') &&
    (location.port === '3000' || !HOSTS_LOCAIS.includes(location.hostname));
const API = servidoPeloBackend ? '' : 'http://localhost:3000';

const TIPO = {
    PADRAO: 'PADRAO',
    COMISSIONADO: 'COMISSIONADO',
    PRODUCAO: 'PRODUCAO'
};

const TIPOS = {
    [TIPO.PADRAO]: 'Padrão',
    [TIPO.COMISSIONADO]: 'Comissionado',
    [TIPO.PRODUCAO]: 'Produção'
};

const TITULOS = {
    home: 'Paggo · Início',
    cadastro: 'Paggo · Novo colaborador',
    colaboradores: 'Paggo · Colaboradores',
    folha: 'Paggo · Folha de pagamento'
};

const VIEWS = Object.keys(TITULOS);

const $ = (id) => document.getElementById(id);
const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rotuloTipo = (tipo) => TIPOS[tipo] || esc(tipo);
const rotuloContagem = (n) => `${n} ${n === 1 ? 'colaborador cadastrado' : 'colaboradores cadastrados'}`;
const linhaMensagem = (colunas, texto) => `<tr><td colspan="${colunas}" class="vazio">${texto}</td></tr>`;

function notificar(acao, nome) {
    const destaque = document.createElement('strong');
    destaque.textContent = nome;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.append('Colaborador ', destaque, ` ${acao} com sucesso!`);

    $('toasts').appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function mostrarMsg(texto, tipo = '', id = 'msgForm') {
    const el = $(id);
    el.textContent = texto;
    el.classList.toggle('erro', tipo === 'erro');
    el.classList.toggle('ok', tipo === 'ok');
}

async function api(caminho, opcoes = {}) {
    let resp;
    try {
        resp = await fetch(API + caminho, {
            headers: { 'Content-Type': 'application/json' },
            ...opcoes
        });
    } catch {
        throw new Error('Não foi possível conectar ao backend. Verifique se o servidor está rodando (npm start na pasta backend).');
    }
    const dados = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(dados.error || `Erro ${resp.status}`);
    return dados;
}

let colaboradores = [];
let matriculaEmEdicao = null;

async function carregarColaboradores() {
    mostrarMsg('', '', 'msgLista');
    try {
        colaboradores = await api('/colaboradores');
    } catch (e) {
        colaboradores = [];
        mostrarMsg(e.message, 'erro', 'msgLista');
    }
    renderTabela();
}

function renderTabela() {
    $('contador').textContent = colaboradores.length ? rotuloContagem(colaboradores.length) : '';
    $('homeContador').textContent = colaboradores.length ? rotuloContagem(colaboradores.length) : 'Consulte, edite ou exclua.';

    if (!colaboradores.length) {
        $('tabelaColaboradores').innerHTML = linhaMensagem(5, 'Nenhum colaborador cadastrado.');
        return;
    }

    $('tabelaColaboradores').innerHTML = colaboradores.map((c) => `
        <tr class="${c.matricula === matriculaEmEdicao ? 'editando' : ''}">
            <td>${c.matricula}</td>
            <td>${esc(c.nome)}</td>
            <td><span class="tag">${rotuloTipo(c.tipo)}</span></td>
            <td class="num">${brl(c.salarioBase)}</td>
            <td class="acoes">
                <button class="link-btn" data-acao="editar" data-matricula="${c.matricula}" aria-label="Editar ${esc(c.nome)}">Editar</button>
                <button class="link-btn danger" data-acao="excluir" data-matricula="${c.matricula}" aria-label="Excluir ${esc(c.nome)}">Excluir</button>
            </td>
        </tr>
    `).join('');
}

async function salvarColaborador(event) {
    event.preventDefault();
    const colaborador = lerFormulario();
    const btn = $('btnSalvar');

    const editando = matriculaEmEdicao !== null;
    const matricula = matriculaEmEdicao;

    btn.disabled = true;

    try {
        await api(editando ? `/colaboradores/${matricula}` : '/colaboradores', {
            method: editando ? 'PUT' : 'POST',
            body: JSON.stringify(colaborador)
        });

        limparFormulario();
        await carregarColaboradores();
        atualizarFolhaSeVisivel();

        notificar(editando ? 'atualizado' : 'criado', colaborador.nome);
        if (editando) location.hash = '#colaboradores';
    } catch (e) {
        mostrarMsg(e.message, 'erro');
    } finally {
        btn.disabled = false;
    }
}

async function excluirColaborador(matricula) {
    const c = colaboradores.find((col) => col.matricula === matricula);
    if (!(await confirmarExclusao(c?.nome))) return;

    try {
        await api(`/colaboradores/${matricula}`, { method: 'DELETE' });
        if (matriculaEmEdicao === matricula) limparFormulario();
        await carregarColaboradores();
        atualizarFolhaSeVisivel();
        notificar('excluído', c?.nome ?? matricula);
    } catch (e) {
        mostrarMsg(e.message, 'erro', 'msgLista');
    }
}

function lerFormulario() {
    const num = (id) => {
        const v = $(id).value.trim();
        return v === '' ? undefined : Number(v);
    };

    const colaborador = {
        matricula: num('matricula'),
        nome: $('nome').value.trim(),
        salarioBase: num('salarioBase'),
        tipo: $('tipo').value
    };

    if (colaborador.tipo === TIPO.COMISSIONADO) {
        colaborador.valorVendas = num('valorVendas');
        colaborador.percentualComissao = num('percentualComissao');
    } else if (colaborador.tipo === TIPO.PRODUCAO) {
        colaborador.quantidadeProduzida = num('quantidadeProduzida');
        colaborador.valorPorUnidade = num('valorPorUnidade');
    }
    return colaborador;
}

function editarColaborador(matricula) {
    const c = colaboradores.find((col) => col.matricula === matricula);
    if (!c) return;

    matriculaEmEdicao = matricula;
    $('matricula').value = c.matricula;
    $('matricula').disabled = true;
    $('nome').value = c.nome;
    $('salarioBase').value = c.salarioBase;
    $('tipo').value = c.tipo;
    $('valorVendas').value = c.valorVendas ?? 0;
    $('percentualComissao').value = c.percentualComissao ?? 0;
    $('quantidadeProduzida').value = c.quantidadeProduzida ?? 0;
    $('valorPorUnidade').value = c.valorPorUnidade ?? 0;

    $('tituloForm').textContent = `Editando matrícula ${matricula}`;
    $('btnSalvar').textContent = 'Atualizar';
    mostrarMsg('');
    mudarCamposTipo();
    renderTabela();
    location.hash = '#cadastro';
    navegar();
    $('nome').focus();
}

function limparFormulario() {
    $('formColaborador').reset();
    $('matricula').disabled = false;
    matriculaEmEdicao = null;
    $('tituloForm').textContent = 'Novo colaborador';
    $('btnSalvar').textContent = 'Salvar';
    mostrarMsg('');
    mudarCamposTipo();
    renderTabela();
}

function mudarCamposTipo() {
    const tipo = $('tipo').value;
    $('camposComissionado').classList.toggle('hidden', tipo !== TIPO.COMISSIONADO);
    $('camposProducao').classList.toggle('hidden', tipo !== TIPO.PRODUCAO);
}

async function gerarFolha() {
    const btn = $('btnGerarFolha');
    btn.disabled = true;
    mostrarMsg('', '', 'msgFolha');

    try {
        const [folha, resumo] = await Promise.all([api('/folha'), api('/folha/resumo')]);

        renderFolha(folha);
        renderResumo(resumo);

        $('areaRelatorio').classList.remove('hidden');
        $('folhaVazia').classList.add('hidden');
        btn.textContent = 'Recalcular';
    } catch (e) {
        mostrarMsg(`Erro ao gerar a folha: ${e.message}`, 'erro', 'msgFolha');
    } finally {
        btn.disabled = false;
    }
}

function renderFolha(folha) {
    $('tabelaFolha').innerHTML = folha.length
        ? folha.map((f) => `
            <tr>
                <td>${f.matricula}</td>
                <td>${esc(f.nome)}</td>
                <td><span class="tag">${rotuloTipo(f.tipo)}</span></td>
                <td class="num">${brl(f.salarioBase)}</td>
                <td class="num">${brl(f.adicional)}</td>
                <td class="num"><strong>${brl(f.salarioFinal)}</strong></td>
            </tr>
        `).join('')
        : linhaMensagem(6, 'Nenhum colaborador cadastrado.');
}

function renderResumo(resumo) {
    $('resumoQtd').textContent = resumo.quantidadeColaboradores;
    $('resumoBase').textContent = brl(resumo.totalSalariosBase);
    $('resumoAdicionais').textContent = brl(resumo.totalAdicionais);
    $('resumoTotal').textContent = brl(resumo.totalSalariosFinais);
    $('resumoPorTipo').innerHTML = Object.entries(resumo.totalPorTipo || {})
        .map(([tipo, total]) => `${rotuloTipo(tipo)}: <strong>${brl(total)}</strong>`)
        .join(' &nbsp;·&nbsp; ');
}

function atualizarFolhaSeVisivel() {
    if (!$('areaRelatorio').classList.contains('hidden')) gerarFolha();
}

function confirmarExclusao(nome) {
    const dialog = $('modalConfirmar');
    $('confirmarNome').textContent = nome || 'este colaborador';
    dialog.returnValue = '';

    return new Promise((resolve) => {
        dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirmar'), { once: true });
        dialog.showModal();
    });
}

function navegar() {
    const hash = location.hash.slice(1);
    const alvo = VIEWS.includes(hash) ? hash : 'home';

    VIEWS.forEach((v) => $(`view-${v}`).classList.toggle('hidden', v !== alvo));
    document.querySelectorAll('.topnav a').forEach((a) => {
        a.toggleAttribute('aria-current', a.hash === `#${alvo}`);
    });

    document.title = TITULOS[alvo];
    if (alvo !== 'cadastro') limparFormulario();
    window.scrollTo(0, 0);
}

function iniciar() {
    $('formColaborador').addEventListener('submit', salvarColaborador);
    $('btnLimpar').addEventListener('click', limparFormulario);
    $('tipo').addEventListener('change', mudarCamposTipo);
    $('btnGerarFolha').addEventListener('click', gerarFolha);

    $('tabelaColaboradores').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-acao]');
        if (!btn) return;
        const matricula = Number(btn.dataset.matricula);
        if (btn.dataset.acao === 'editar') editarColaborador(matricula);
        else excluirColaborador(matricula);
    });

    $('modalConfirmar').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.close('cancelar');
    });

    window.addEventListener('hashchange', navegar);
    navegar();

    $('tabelaColaboradores').innerHTML = linhaMensagem(5, 'Carregando...');
    carregarColaboradores();
}

iniciar();