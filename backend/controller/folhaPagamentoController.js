import db from '../db.js';
import { calcularSalario } from '../regraNegocios.js';

export async function getFolhaDePagamento(req, res) {
    try {
        const folhaDePagamento = db.map(colaborador => {
            const salarioFinal = calcularSalario(colaborador);
            const adicional = salarioFinal - colaborador.salarioBase;

            return {
                matricula: colaborador.matricula,
                nome: colaborador.nome,
                tipo: colaborador.tipo,
                salarioBase: colaborador.salarioBase,
                adicional: adicional,
                salarioFinal: salarioFinal
            };
        });

        res.send(folhaDePagamento);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

export async function getResumoFolhaDePagamento(req, res) {
    try {
        const resumo = db.reduce((acc, colaborador) => {
            const salarioFinal = calcularSalario(colaborador);
            acc.totalSalariosBase += colaborador.salarioBase;
            acc.totalAdicionais += salarioFinal - colaborador.salarioBase;
            acc.totalSalariosFinais += salarioFinal;
            return acc;
        }, { totalSalariosBase: 0, totalAdicionais: 0, totalSalariosFinais: 0 });
        res.send(resumo);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}
