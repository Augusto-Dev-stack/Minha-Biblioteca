import express from "express";
import { sequelize } from "./src/config/database.js";
import consultaRoutes from "./consulta.js";
import cadastroRoutes from "./cadastro.js";

const app = express();
const port = 8000;

app.use(express.json());

// Associa os arquivos ao caminho base /livros
app.use('/livros', consultaRoutes);
app.use('/livros', cadastroRoutes);

sequelize.sync().then(() => {
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
});