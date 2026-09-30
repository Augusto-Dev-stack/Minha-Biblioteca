import express from "express";
import { Livro } from "./src/config/database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const livros = await Livro.findAll();
    return res.status(200).json(livros);
  } catch (error) {
    return res
      .status(500)
      .json({ erro: "Erro ao procurar livros", detalhe: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const livro = await Livro.findByPk(req.params.id);
    if (!livro) return res.status(404).json({ erro: "Livro não encontrado" });
    return res.status(200).json(livro);
  } catch (error) {
    return res
      .status(500)
      .json({ erro: "Erro ao procurar o livro", detalhe: error.message });
  }
});

export default router;
