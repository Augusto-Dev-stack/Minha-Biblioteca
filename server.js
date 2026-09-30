import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração do Banco de Dados SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './livraria.sqlite',
    logging: false
});

// Modelo do Livro
const Livro = sequelize.define('Livro', {
    titulo: { type: DataTypes.STRING, allowNull: false },
    autor: { type: DataTypes.STRING, allowNull: false },
    editora: DataTypes.STRING,
    categoria: DataTypes.STRING,
    ano: DataTypes.INTEGER,
    estoque: { type: DataTypes.INTEGER, defaultValue: 1 },
    capa: DataTypes.TEXT,
    descricao: DataTypes.TEXT,
    preco: { type: DataTypes.FLOAT, defaultValue: 0 }
});

// Rota de Teste
app.get('/', (req, res) => {
    res.send('Backend Express rodando na porta 3030!');
});

// Rota GET: Listar todos os livros
app.get('/livros', async (req, res) => {
    try {
        const livros = await Livro.findAll();
        res.status(200).json(livros);
    } catch (error) {
        console.error('Erro ao buscar livros:', error);
        res.status(500).json({ erro: 'Erro ao buscar livros na base de dados.' });
    }
});

// Rota POST: Cadastrar novo livro
app.post('/livros', async (req, res) => {
    try {
        const novoLivro = await Livro.create(req.body);
        res.status(201).json(novoLivro);
    } catch (error) {
        console.error('Erro ao salvar livro:', error);
        res.status(400).json({ erro: 'Erro ao cadastrar livro', detalhe: error.message });
    }
});

// Rota DELETE: Excluir livro pelo ID
app.delete('/livros/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const livro = await Livro.findByPk(id);

        if (!livro) {
            return res.status(404).json({ erro: 'Livro não encontrado.' });
        }

        await livro.destroy();
        res.status(200).json({ mensagem: 'Livro excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir livro:', error);
        res.status(500).json({ erro: 'Erro ao excluir livro da base de dados.' });
    }
});

// Iniciar o Servidor
const PORTA = 3030;
sequelize.sync({ alter: true }).then(() => {
    app.listen(PORTA, '127.0.0.1', () => {
        console.log(`Backend rodando em http://127.0.0.1:${PORTA}`);
    });
}).catch(err => console.error('Erro de conexão no banco:', err));