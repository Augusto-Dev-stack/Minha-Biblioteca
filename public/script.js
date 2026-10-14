document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://127.0.0.1:3030';

  function getUsuarioSessao() {
    const sessao = localStorage.getItem('usuario_sessao');
    return sessao ? JSON.parse(sessao) : null;
  }

  function setUsuarioSessao(usuario) {
    localStorage.setItem('usuario_sessao', JSON.stringify(usuario));
  }

  window.fecharSessao = function () {
    localStorage.removeItem('usuario_sessao');
    alert('Sessão encerrada com sucesso.');
    window.location.href = 'index.html';
  };

  const conteinerAcoesHeader = document.querySelector('.acoes-cabecalho');
  const usuarioLogado = getUsuarioSessao();

  if (conteinerAcoesHeader) {
    if (usuarioLogado) {
      const rotuloTipo = usuarioLogado.tipo === 'admin' ? 'Admin' : 'Aluno';
      conteinerAcoesHeader.innerHTML = `
        <span style="margin-right: 10px; font-weight: 600;">Olá, ${usuarioLogado.nome} (${rotuloTipo})</span>
        ${usuarioLogado.tipo === 'admin' ? '<a class="botao-menu" href="cadastro.html">Cadastrar livro</a>' : ''}
        <button class="botao-menu" onclick="fecharSessao()">Sair</button>
      `;
    } else {
      conteinerAcoesHeader.innerHTML = `
        <a class="botao-menu" href="selecionar-acesso.html">Entrar / Cadastrar</a>
      `;
    }
  }

  const formCadastroAluno = document.querySelector('.cadastro-usuario form') ||
    document.getElementById('form-cadastro-aluno') ||
    document.querySelector('form[action*="cadastro"]');

  if (formCadastroAluno) {
    formCadastroAluno.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome = document.getElementById('nome-aluno-cadastro')?.value || document.getElementById('nome')?.value;
      const matricula = document.getElementById('matricula-aluno-cadastro')?.value || document.getElementById('matricula')?.value;
      const turma = document.getElementById('turma-aluno-cadastro')?.value || document.getElementById('turma')?.value;
      const email = document.getElementById('email-aluno-cadastro')?.value || document.getElementById('email')?.value;
      const telefone = document.getElementById('telefone-aluno-cadastro')?.value || document.getElementById('telefone')?.value;
      const senha = document.getElementById('senha-aluno-cadastro')?.value || document.getElementById('senha')?.value;
      const confirmarSenha = document.getElementById('confirmar-senha-aluno-cadastro')?.value || document.getElementById('confirmar-senha')?.value;

      if (senha && confirmarSenha && senha !== confirmarSenha) {
        alert('As senhas digitadas não coincidem.');
        return;
      }

      try {
        const resposta = await fetch(`${API_URL}/alunos/cadastro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, matricula, turma, email, telefone, senha })
        });

        const dados = await resposta.json();
        if (resposta.ok) {
          alert('Conta criada com sucesso! Faça login para continuar.');
          window.location.href = 'login.html';
        } else {
          alert(`Erro no cadastro: ${dados.erro}`);
        }
      } catch (error) {
        console.error('Erro na conexão:', error);
        alert('Falha ao conectar com o servidor.');
      }
    });
  }

  const formLoginAluno = document.getElementById('form-login-unico') ||
    document.getElementById('form-login-aluno') ||
    document.querySelector('.login-aluno form');

  if (formLoginAluno) {
    formLoginAluno.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email-login')?.value || document.getElementById('email')?.value;
      const senha = document.getElementById('senha-login')?.value || document.getElementById('senha')?.value;

      try {
        const resposta = await fetch(`${API_URL}/alunos/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();
        if (resposta.ok) {
          setUsuarioSessao(dados.usuario);
          alert(`Bem-vindo, ${dados.usuario.nome}!`);
          window.location.href = 'index.html';
        } else {
          alert(`Erro no login: ${dados.erro}`);
        }
      } catch (error) {
        console.error('Erro na conexão:', error);
        alert('Falha ao conectar com o servidor.');
      }
    });
  }

  const formLoginProfessor = document.querySelector('form label[for="senha-login-professor"]')?.closest('form') ||
    document.getElementById('form-login-professor');

  if (formLoginProfessor) {
    formLoginProfessor.addEventListener('submit', async (e) => {
      e.preventDefault();

      const senha = document.getElementById('senha-login-professor')?.value || document.getElementById('senha')?.value;

      try {
        const resposta = await fetch(`${API_URL}/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha })
        });

        const dados = await resposta.json();
        if (resposta.ok) {
          setUsuarioSessao(dados.usuario);
          alert('Autenticado como Administrador!');
          window.location.href = 'index.html';
        } else {
          alert(`Erro: ${dados.erro}`);
        }
      } catch (error) {
        console.error('Erro na conexão:', error);
        alert('Falha ao conectar com o servidor.');
      }
    });
  }

  window.alugarLivro = async function (idLivro) {
    const usuario = getUsuarioSessao();

    if (!usuario) {
      alert('Precisa de fazer login como aluno para alugar livros.');
      window.location.href = 'selecionar-acesso.html';
      return;
    }

    if (usuario.tipo !== 'aluno') {
      alert('Apenas alunos podem realizar aluguer de livros.');
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/livros/${idLivro}/alugar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alunoId: usuario.id })
      });

      const dados = await resposta.json();
      if (resposta.ok) {
        alert(dados.mensagem);
        location.reload();
      } else {
        alert(`Erro ao alugar: ${dados.erro}`);
      }
    } catch (error) {
      console.error('Erro ao alugar:', error);
      alert('Falha ao conectar com o servidor.');
    }
  };

  window.deletarLivro = async function (id) {
    const usuario = getUsuarioSessao();
    if (!usuario || usuario.tipo !== 'admin') {
      alert('Apenas o Administrador tem permissão para excluir livros.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este livro?')) return;

    try {
      const resposta = await fetch(`${API_URL}/livros/${id}`, { method: 'DELETE' });

      if (resposta.ok) {
        alert('Livro excluído com sucesso!');
        const cartaoLivro = document.querySelector(`.livro[data-id="${id}"]`);
        if (cartaoLivro) cartaoLivro.remove();
      } else {
        const erro = await resposta.json();
        alert(`Erro ao excluir: ${erro.erro}`);
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Falha ao conectar com o servidor.');
    }
  };

  const containerLivros = document.querySelector('.lista-livros');
  if (containerLivros) {
    async function carregarLivros() {
      try {
        const resposta = await fetch(`${API_URL}/livros`);
        if (!resposta.ok) throw new Error('Erro ao buscar livros');

        const livros = await resposta.json();
        renderizarLivros(livros);
      } catch (erro) {
        console.error('Erro ao carregar livros:', erro);
        containerLivros.innerHTML = '<p>Erro ao conectar com a base de dados.</p>';
      }
    }

    function renderizarLivros(lista) {
      if (lista.length === 0) {
        containerLivros.innerHTML = '<p>Nenhum livro cadastrado no momento.</p>';
        return;
      }

      const user = getUsuarioSessao();

      containerLivros.innerHTML = lista.map(livro => {
        const capaSrc = livro.capa ? livro.capa : 'https://via.placeholder.com/180x250?text=Sem+Capa';
        const disponivel = !livro.alugado && livro.estoque > 0;

        return `
          <article class="livro" data-id="${livro.id}">
            <img src="${capaSrc}" alt="Capa de ${livro.titulo}" class="capa-livro" />
            <h3 class="titulo-livro">${livro.titulo}</h3>
            <p class="detalhes-livro"><strong>Autor:</strong> ${livro.autor}</p>
            ${livro.categoria ? `<p class="detalhes-livro"><strong>Categoria:</strong> ${livro.categoria}</p>` : ''}
            <p class="detalhes-livro"><strong>Exemplares:</strong> ${livro.estoque}</p>
            
            <div style="margin-top: auto; padding-top: 10px; display: flex; gap: 8px; flex-direction: column;">
              ${disponivel
            ? `<button class="botao-principal" onclick="alugarLivro(${livro.id})">Alugar livro</button>`
            : `<button class="botao-principal" disabled style="background-color: #9ca3af; cursor: not-allowed;">Indisponível / Alugado</button>`
          }

              ${user && user.tipo === 'admin'
            ? `<button class="botao-excluir" onclick="deletarLivro(${livro.id})">Excluir livro</button>`
            : ''
          }
            </div>
          </article>
        `;
      }).join('');
    }

    carregarLivros();
  }
});