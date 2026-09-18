import express from "express";
import { Livro } from "./src/config/database.js";

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { id, titulo, autor, preco, estoque } = req.body;
    const novoLivro = await Livro.create({ id, titulo, autor, preco, estoque });
    res.status(201).json(novoLivro);
  } catch (error) {
    res.status(400).json({ erro: 'Não foi possível cadastrar o livro', detalhe: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const livro = await Livro.findByPk(req.params.id);
    if (!livro) return res.status(404).json({ erro: 'Livro não encontrado' });

    await livro.destroy();
    res.json({ mensagem: 'Livro removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao deletar o livro' });
  }
});

export default router;