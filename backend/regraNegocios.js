import db from './db.js';

export function validarColaborador(colaborador, colaboradorIndex = -1) {
    const {
        matricula,
        nome,
        salarioBase,
        tipo,
        valorVendas,
        percentualComissao,
        quantidadeProduzida,
        valorPorUnidade
    } = colaborador;

    if (!matricula) {
        throw new Error("Matrícula é obrigatória");
    }

    if (db.some((c, index) => c.matricula === matricula && index !== colaboradorIndex)) {
        throw new Error("Matrícula já cadastrada");
    }

    if (!nome || nome.trim() === "") {
        throw new Error("Nome é obrigatório");
    }

    if (salarioBase === undefined || salarioBase === null) {
        throw new Error("Salário base é obrigatório");
    }

    if (salarioBase < 0) {
        throw new Error("Salário base não pode ser negativo");
    }

    if (!["PADRAO", "COMISSIONADO", "PRODUCAO"].includes(tipo)) {
        throw new Error("Tipo de colaborador inválido");
    }

    if (tipo === "COMISSIONADO") {
        if (valorVendas === undefined || valorVendas === null) {
            throw new Error("Valor das vendas é obrigatório");
        }

        if (valorVendas < 0) {
            throw new Error("Valor das vendas não pode ser negativo");
        }

        if (percentualComissao === undefined || percentualComissao === null) {
            throw new Error("Percentual de comissão é obrigatório");
        }

        if (percentualComissao < 0) {
            throw new Error("Percentual de comissão não pode ser negativo");
        }
    }

    if (tipo === "PRODUCAO") {
        if (quantidadeProduzida === undefined || quantidadeProduzida === null) {
            throw new Error("Quantidade produzida é obrigatória");
        }

        if (quantidadeProduzida < 0) {
            throw new Error("Quantidade produzida não pode ser negativa");
        }

        if (valorPorUnidade === undefined || valorPorUnidade === null) {
            throw new Error("Valor por unidade é obrigatório");
        }

        if (valorPorUnidade < 0) {
            throw new Error("Valor por unidade não pode ser negativa");
        }
    }
}

export function calcularSalario(colaborador) {
    const { salarioBase, tipo } = colaborador;

    if (tipo === "PADRAO") {
        return salarioBase;
    }

    if (tipo === "COMISSIONADO") {
        return salarioBase +
            colaborador.valorVendas *
            (colaborador.percentualComissao / 100);
    }

    if (tipo === "PRODUCAO") {
        return salarioBase +
            colaborador.quantidadeProduzida *
            colaborador.valorPorUnidade;
    }
}