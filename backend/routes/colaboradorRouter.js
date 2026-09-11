import express from 'express';
const router = express.Router();
import { getColaboradores, getColaboradorByMatricula, postColaborador, putColaborador, deleteColaborador } from '../controller/colaboradorController.js';

router.get('/', getColaboradores);
router.get('/:matricula', getColaboradorByMatricula);
router.post('/', postColaborador);
router.put('/:matricula', putColaborador);
router.delete('/:matricula', deleteColaborador);
export default router