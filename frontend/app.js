// Se a página for servida pelo próprio backend (porta 3000), usa caminho relativo;
// se for aberta direto do arquivo ou por outro servidor, aponta para o backend local.
const API = location.port === '3000' ? '' : 'http://localhost:3000';

const TIPOS = {
    PADRAO: 'Padrão',
    COMISSIONADO: 'Comissionado',
    PRODUCAO: 'Produção'
};

const $ = (id) => document.getElementById(id);
const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let colaboradores = [];
let matriculaEmEdicao = null;

// ---------- API ----------

async function api(caminho, opcoes = {}) {
    const resp = await fetch(API + caminho, {
        headers: { 'Content-Type': 'application/json' },
        ...opcoes
    });
    const dados = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(dados.error || `Erro ${resp.status}`);
    return dados;
}

function setStatusApi(online) {
    const el = $('statusApi');
    el.textContent = online ? 'API conectada' : 'API offline';
    el.className = 'status-api ' + (online ? 'online' : 'offline');
}

// ---------- Colaboradores ----------

async function carregarColaboradores() {
    try {
        colaboradores = await api('/colaboradores');
        setStatusApi(true);
    } catch (e) {
        colaboradores = [];
        setStatusApi(false);
        mostrarMsg('Não foi possível conectar ao backend. Rode "npm start" na pasta backend.', 'erro');
    }
    renderTabela();
}

function renderTabela() {
    const tbody = $('tabelaColaboradores');
    $('contador').textContent = colaboradores.length ? `${colaboradores.length} cadastrados` : '';

    if (!colaboradores.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="vazio">Nenhum colaborador cadastrado.</td></tr>';
        return;
    }

    tbody.innerHTML = colaboradores.map((c) => `
        <tr class="${c.matricula === matriculaEmEdicao ? 'editando' : ''}">
            <td>${c.matricula}</td>
            <td>${esc(c.nome)}</td>
            <td><span class="tag">${TIPOS[c.tipo] || esc(c.tipo)}</span></td>
            <td class="num">${brl(c.salarioBase)}</td>
            <td class="acoes">
                <button class="link-btn" data-acao="editar" data-matricula="${c.matricula}">Editar</button>
                <button class="link-btn danger" data-acao="excluir" data-matricula="${c.matricula}">Excluir</button>
            </td>
        </tr>
    `).join('');
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

    if (colaborador.tipo === 'COMISSIONADO') {
        colaborador.valorVendas = num('valorVendas');
        colaborador.percentualComissao = num('percentualComissao');
    } else if (colaborador.tipo === 'PRODUCAO') {
        colaborador.quantidadeProduzida = num('quantidadeProduzida');
        colaborador.valorPorUnidade = num('valorPorUnidade');
    }
    return colaborador;
}

async function salvarColaborador(event) {
    event.preventDefault();
    const colaborador = lerFormulario();
    const btn = $('btnSalvar');
    btn.disabled = true;

    try {
        if (matriculaEmEdicao === null) {
            await api('/colaboradores', { method: 'POST', body: JSON.stringify(colaborador) });
        } else {
            await api(`/colaboradores/${matriculaEmEdicao}`, { method: 'PUT', body: JSON.stringify(colaborador) });
        }
        const msg = matriculaEmEdicao === null ? 'Colaborador cadastrado.' : 'Colaborador atualizado.';
        limparFormulario();
        mostrarMsg(msg, 'ok');
        await carregarColaboradores();
        atualizarFolhaSeVisivel();
    } catch (e) {
        mostrarMsg(e.message, 'erro');
    } finally {
        btn.disabled = false;
    }
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
    $('nome').focus();
}

async function excluirColaborador(matricula) {
    const c = colaboradores.find((col) => col.matricula === matricula);
    if (!confirm(`Excluir ${c ? c.nome : 'colaborador'}?`)) return;

    try {
        await api(`/colaboradores/${matricula}`, { method: 'DELETE' });
        if (matriculaEmEdicao === matricula) limparFormulario();
        await carregarColaboradores();
        atualizarFolhaSeVisivel();
    } catch (e) {
        mostrarMsg(e.message, 'erro');
    }
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
    $('camposComissionado').classList.toggle('hidden', tipo !== 'COMISSIONADO');
    $('camposProducao').classList.toggle('hidden', tipo !== 'PRODUCAO');
}

function mostrarMsg(texto, tipo = '') {
    const el = $('msgForm');
    el.textContent = texto;
    el.className = 'msg ' + tipo;
}

// ---------- Folha ----------

async function gerarFolha() {
    const btn = $('btnGerarFolha');
    btn.disabled = true;

    try {
        const [folha, resumo] = await Promise.all([api('/folha'), api('/folha/resumo')]);

        $('tabelaFolha').innerHTML = folha.length
            ? folha.map((f) => `
                <tr>
                    <td>${f.matricula}</td>
                    <td>${esc(f.nome)}</td>
                    <td><span class="tag">${TIPOS[f.tipo] || esc(f.tipo)}</span></td>
                    <td class="num">${brl(f.salarioBase)}</td>
                    <td class="num">${brl(f.adicional)}</td>
                    <td class="num"><strong>${brl(f.salarioFinal)}</strong></td>
                </tr>
            `).join('')
            : '<tr><td colspan="6" class="vazio">Nenhum colaborador cadastrado.</td></tr>';

        $('resumoQtd').textContent = resumo.quantidadeColaboradores;
        $('resumoBase').textContent = brl(resumo.totalSalariosBase);
        $('resumoAdicionais').textContent = brl(resumo.totalAdicionais);
        $('resumoTotal').textContent = brl(resumo.totalSalariosFinais);
        $('resumoPorTipo').innerHTML = Object.entries(resumo.totalPorTipo || {})
            .map(([tipo, total]) => `${TIPOS[tipo] || tipo}: <strong>${brl(total)}</strong>`)
            .join(' &nbsp;·&nbsp; ');

        $('areaRelatorio').classList.remove('hidden');
        $('folhaVazia').classList.add('hidden');
        btn.textContent = 'Recalcular';
    } catch (e) {
        alert('Erro ao gerar a folha: ' + e.message);
    } finally {
        btn.disabled = false;
    }
}

function atualizarFolhaSeVisivel() {
    if (!$('areaRelatorio').classList.contains('hidden')) gerarFolha();
}

// ---------- Eventos ----------

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

carregarColaboradores();
