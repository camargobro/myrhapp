import express from 'express';
const router = express.Router();
import { getFolhaDePagamento, getResumoFolhaDePagamento} from '../controller/folhaPagamentoController.js';

router.get('/', getFolhaDePagamento);
router.get('/resumo', getResumoFolhaDePagamento);

export default router;