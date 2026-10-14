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
    alugado: { type: DataTypes.BOOLEAN, defaultValue: false }
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

        if (!nome || !matricula || !turma || !email || !senha) {
            return res.status(400).json({ erro: 'Por favor, preencha todos os campos obrigatórios.' });
        }

        const emailExistente = await Aluno.findOne({ where: { email } });
        if (emailExistente) {
            return res.status(400).json({ erro: 'Este e-mail já está registado.' });
        }

        const matriculaExistente = await Aluno.findOne({ where: { matricula } });
        if (matriculaExistente) {
            return res.status(400).json({ erro: 'Esta matrícula já está registada.' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const novoAluno = await Aluno.create({
            nome,
            matricula,
            turma,
            email,
            telefone,
            senha: senhaHash
        });

        res.status(201).json({
            mensagem: 'Aluno cadastrado com sucesso!',
            aluno: { id: novoAluno.id, nome: novoAluno.nome, email: novoAluno.email }
        });
    } catch (error) {
        console.error('Erro no cadastro do aluno:', error);
        res.status(400).json({ erro: 'Erro ao cadastrar aluno.', detalhe: error.message });
    }
});

app.post('/alunos/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Informe o e-mail e a senha.' });
        }

        const aluno = await Aluno.findOne({ where: { email } });
        if (!aluno) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }

        let senhaValida = await bcrypt.compare(senha, aluno.senha);
        if (!senhaValida && senha === aluno.senha) {
            senhaValida = true;
        }

        if (!senhaValida) {
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

app.get('/alunos', async (req, res) => {
    try {
        const alunos = await Aluno.findAll({ attributes: { exclude: ['senha'] } });
        res.status(200).json(alunos);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao procurar alunos.' });
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

app.post('/professores/login', (req, res) => {
    const { senha } = req.body;
    if (senha === '25181301' || senha === SENHA_ADMIN_MESTRE) {
        return res.status(200).json({
            mensagem: 'Acesso concedido!',
            usuario: { nome: 'Professor', tipo: 'admin' }
        });
    }
    return res.status(401).json({ erro: 'Senha incorreta!' });
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
        if (!livro) return res.status(404).json({ erro: 'Livro não encontrado.' });

        await livro.destroy();
        res.status(200).json({ mensagem: 'Livro excluído com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao excluir livro.' });
    }
});

const processarAluguer = async (req, res) => {
    try {
        const { id } = req.params;
        const { alunoId } = req.body;

        const livro = await Livro.findByPk(id);
        if (!livro) return res.status(404).json({ erro: 'Livro não encontrado.' });

        if (livro.alugado || livro.estoque <= 0) {
            return res.status(400).json({ erro: 'Este livro já se encontra alugado ou indisponível.' });
        }

        if (alunoId) {
            await Aluguel.create({ alunoId, livroId: livro.id });
        }

        livro.alugado = true;
        if (livro.estoque > 0) livro.estoque -= 1;
        await livro.save();

        res.status(200).json({ mensagem: `Livro "${livro.titulo}" alugado com sucesso!`, livro });
    } catch (error) {
        console.error('Erro ao alugar livro:', error);
        res.status(500).json({ erro: 'Erro ao processar o aluguer.' });
    }
};

app.post('/livros/:id/alugar', processarAluguer);
app.patch('/livros/:id/alugar', processarAluguer);

const PORTA = 3030;
sequelize.sync().then(() => {
    app.listen(PORTA, '127.0.0.1', () => {
        console.log(`Backend rodando em http://127.0.0.1:${PORTA}`);
    });
}).catch(err => console.error('Erro de conexão no banco:', err));