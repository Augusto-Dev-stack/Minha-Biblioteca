import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './livraria.sqlite',
    logging: false
});

const Livro = sequelize.define('Livro', {
    titulo: { type: DataTypes.STRING, allowNull: false },
    autor: { type: DataTypes.STRING, allowNull: false },
    editora: DataTypes.STRING,
    categoria: DataTypes.STRING,
    ano: DataTypes.INTEGER,
    estoque: { type: DataTypes.INTEGER, defaultValue: 1 },
    capa: DataTypes.TEXT,
    descricao: DataTypes.TEXT,
    alugado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

const Aluno = sequelize.define('Aluno', {
    nome: { type: DataTypes.STRING, allowNull: false },
    matricula: { type: DataTypes.STRING, allowNull: false, unique: true },
    turma: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    telefone: DataTypes.STRING,
    senha: { type: DataTypes.STRING, allowNull: false }
});

const Aluguel = sequelize.define('Aluguel', {
    alunoId: { type: DataTypes.INTEGER, allowNull: false },
    livroId: { type: DataTypes.INTEGER, allowNull: false },
    dataAluguel: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

Aluno.hasMany(Aluguel, { foreignKey: 'alunoId' });
Livro.hasMany(Aluguel, { foreignKey: 'livroId' });
Aluguel.belongsTo(Aluno, { foreignKey: 'alunoId' });
Aluguel.belongsTo(Livro, { foreignKey: 'livroId' });

app.post('/alunos/cadastro', async (req, res) => {
    try {
        const { nome, matricula, turma, email, telefone, senha } = req.body;

        const alunoExistente = await Aluno.findOne({ where: { email } });
        if (alunoExistente) {
            return res.status(400).json({ erro: 'Este e-mail já está registado.' });
        }

        const novoAluno = await Aluno.create({ nome, matricula, turma, email, telefone, senha });
        res.status(201).json({ mensagem: 'Aluno cadastrado com sucesso!', aluno: { id: novoAluno.id, nome: novoAluno.nome, email: novoAluno.email } });
    } catch (error) {
        console.error('Erro no cadastro do aluno:', error);
        res.status(400).json({ erro: 'Erro ao cadastrar aluno.', detalhe: error.message });
    }
});

app.post('/alunos/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const aluno = await Aluno.findOne({ where: { email, senha } });

        if (!aluno) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }

        res.status(200).json({
            mensagem: 'Login efetuado com sucesso!',
            usuario: { id: aluno.id, nome: aluno.nome, email: aluno.email, tipo: 'aluno' }
        });
    } catch (error) {
        console.error('Erro no login do aluno:', error);
        res.status(500).json({ erro: 'Erro interno ao realizar login.' });
    }
});

const SENHA_ADMIN_MESTRE = '251813';

app.post('/admin/login', (req, res) => {
    const { senha } = req.body;

    if (senha === SENHA_ADMIN_MESTRE) {
        return res.status(200).json({
            mensagem: 'Acesso concedido como Administrador!',
            usuario: { nome: 'Professor / Admin', tipo: 'admin' }
        });
    }

    res.status(401).json({ erro: 'Senha de acesso incorreta.' });
});

app.get('/livros', async (req, res) => {
    try {
        const livros = await Livro.findAll();
        res.status(200).json(livros);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao procurar livros.' });
    }
});

app.post('/livros', async (req, res) => {
    try {
        const novoLivro = await Livro.create(req.body);
        res.status(201).json(novoLivro);
    } catch (error) {
        res.status(400).json({ erro: 'Erro ao cadastrar livro.', detalhe: error.message });
    }
});

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
        res.status(500).json({ erro: 'Erro ao excluir livro.' });
    }
});

app.post('/livros/:id/alugar', async (req, res) => {
    try {
        const { id } = req.params;
        const { alunoId } = req.body;

        if (!alunoId) {
            return res.status(400).json({ erro: 'É necessário estar logado como aluno.' });
        }

        const livro = await Livro.findByPk(id);
        if (!livro) {
            return res.status(404).json({ erro: 'Livro não encontrado.' });
        }

        if (livro.estoque <= 0) {
            return res.status(400).json({ erro: 'Este livro não possui exemplares disponíveis no momento.' });
        }

        await Aluguel.create({ alunoId, livroId: livro.id });
        livro.estoque -= 1;
        await livro.save();

        res.status(200).json({ mensagem: `Livro "${livro.titulo}" alugado com sucesso!`, estoqueAtual: livro.estoque });
    } catch (error) {
        console.error('Erro ao alugar livro:', error);
        res.status(500).json({ erro: 'Erro ao processar o aluguer.' });
    }
});

sequelize.sync();

app.post('/alunos/cadastro', async (req, res) => {
    try {
        const novoAluno = await Aluno.create(req.body);
        res.status(201).json(novoAluno);
    } catch (erro) {
        res.status(400).json({ erro: 'Erro ao cadastrar aluno.' });
    }
});

app.post('/alunos/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const aluno = await Aluno.findOne({ where: { email, senha } });

        if (!aluno) return res.status(401).json({ erro: 'Dados incorretos.' });

        res.status(200).json({ mensagem: 'Login com sucesso!', aluno });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
});

app.get('/alunos', async (req, res) => {
    try {
        const alunos = await Aluno.findAll();
        res.status(200).json(alunos);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar alunos.' });
    }
});

app.delete('/alunos/:id', async (req, res) => {
    try {
        await Aluno.destroy({ where: { id: req.params.id } });
        res.status(200).json({ mensagem: 'Aluno removido com sucesso!' });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao remover aluno.' });
    }
});

app.post('/professores/login', (req, res) => {
    const { senha } = req.body;
    const SENHA_MESTRA = 'admin123';

    if (senha === SENHA_MESTRA) {
        return res.status(200).json({
            mensagem: 'Acesso concedido!',
            usuario: { nome: 'Professor', tipo: 'professor' }
        });
    }

    return res.status(401).json({ erro: 'Senha incorreta!' });
});

app.patch('/livros/:id/alugar', async (req, res) => {
    try {
        const { id } = req.params;
        const livro = await Livro.findByPk(id);

        if (!livro) {
            return res.status(404).json({ erro: 'Livro não encontrado.' });
        }

        if (livro.alugado) {
            return res.status(400).json({ erro: 'Este livro já está alugado!' });
        }

        await livro.update({ alugado: true });

        res.status(200).json({ mensagem: 'Livro alugado com sucesso!', livro });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao processar o aluguel.' });
    }
});

async function alugarLivro(idLivro, elementoBotao) {
    try {
        const resposta = await fetch(`http://127.0.0.1:3030/livros/${idLivro}/alugar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        if (resposta.ok) {
            // Altera o visual do botão imediatamente sem precisar recarregar a página
            elementoBotao.innerText = 'Alugado';
            elementoBotao.disabled = true;
            elementoBotao.classList.add('botao-desativado');
            alert('Livro alugado com sucesso!');
        } else {
            const erro = await resposta.json();
            alert(erro.erro || 'Não foi possível alugar o livro.');
        }
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        alert('Erro ao conectar com o servidor.');
    }
}

const PORTA = 3030;
sequelize.sync().then(() => {
    app.listen(PORTA, '127.0.0.1', () => {
        console.log(`Backend rodando em http://127.0.0.1:${PORTA}`);
    });
}).catch(err => console.error('Erro de conexão no banco:', err));