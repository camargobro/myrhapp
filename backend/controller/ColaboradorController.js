import db from '../db.js';
import { validarColaborador} from '../regraNegocios.js';

export async function getColaboradores(req, res){
    try {
        await res.send(db);
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}

export async function getColaboradorByMatricula(req, res){
    try {
        const { matricula } = req.params;
        const colaborador = db.find(colaborador => colaborador.matricula === parseInt(matricula));
        if (!colaborador) {
            return res.status(404).send({error: "Colaborador não encontrado."});
        }
        res.send(colaborador);
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}

export async function postColaborador(req, res){
    try{
        const colaborador = req.body;
        validarColaborador(colaborador);
        db.push(colaborador);
        res.status(201).send({ message: "Colaborador criado com sucesso." });
    } catch (error) {
        res.status(400).send({error: error.message});
    }
}   

export async function putColaborador(req, res){
    try{
        const { matricula } = req.params;
        const colaboradorIndex = db.findIndex(col => col.matricula === parseInt(matricula));
        if (colaboradorIndex === -1) {
            return res.status(404).send({error: "Colaborador não encontrado."});
        }
        const colaborador = {
            ...req.body,
            matricula: parseInt(matricula)
        };
        validarColaborador(colaborador, colaboradorIndex);
        db[colaboradorIndex] = colaborador;
        res.send({ message: "Colaborador atualizado com sucesso." });
    } catch (error) {
        res.status(400).send({error: error.message});
    }
}

export async function deleteColaborador(req, res){
    try{
        const { matricula } = req.params;
        const colaboradorIndex = db.findIndex(col => col.matricula === parseInt(matricula));
        if (colaboradorIndex === -1) {
            return res.status(404).send({error: "Colaborador não encontrado."});
        }
        db.splice(colaboradorIndex, 1);
        res.send({ message: "Colaborador excluído com sucesso." });
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}
