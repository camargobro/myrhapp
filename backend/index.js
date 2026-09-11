import express from 'express';
import colaboradorRouter from './routes/colaboradorRouter.js';
import folhaPagamentoRouter from './routes/folhaPagamentoRouter.js';
const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

app.use(express.json());
app.use('/colaboradores', colaboradorRouter);
app.use('/folha', folhaPagamentoRouter);