import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import colaboradorRouter from './routes/colaboradorRouter.js';
import folhaPagamentoRouter from './routes/folhaPagamentoRouter.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());

// CORS liberado para permitir abrir o front direto do arquivo ou de outro servidor (ex.: Live Server)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/colaboradores', colaboradorRouter);
app.use('/folha', folhaPagamentoRouter);

// Serve o front-end em http://localhost:3000
app.use(express.static(path.join(__dirname, '../frontend')));

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
