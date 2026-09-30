document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://127.0.0.1:3030';

  // --- CONTROLO DE SESSÃO DO UTILIZADOR ---
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

  // --- ATUALIZAR INTERFACE COM BASE NO UTILIZADOR LOGADO ---
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

  // --- LÓGICA DE CADASTRO DE ALUNO ---
  const formCadastroAluno = document.querySelector('.cadastro-usuario form');
  if (formCadastroAluno) {
    formCadastroAluno.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome = document.getElementById('nome-aluno-cadastro').value;
      const matricula = document.getElementById('matricula-aluno-cadastro').value;
      const turma = document.getElementById('turma-aluno-cadastro').value;
      const email = document.getElementById('email-aluno-cadastro').value;
      const telefone = document.getElementById('telefone-aluno-cadastro').value;
      const senha = document.getElementById('senha-aluno-cadastro').value;
      const confirmarSenha = document.getElementById('confirmar-senha-aluno-cadastro').value;

      if (senha !== confirmarSenha) {
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

  // --- LÓGICA DE LOGIN DE ALUNO ---
  const formLoginAluno = document.getElementById('form-login-unico');
  if (formLoginAluno) {
    formLoginAluno.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email-login').value;
      const senha = document.getElementById('senha-login').value;

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

  // --- LÓGICA DE LOGIN DE PROFESSOR / ADMIN ---
  const formLoginProfessor = document.querySelector('form label[for="senha-login-professor"]')?.closest('form');
  if (formLoginProfessor) {
    formLoginProfessor.addEventListener('submit', async (e) => {
      e.preventDefault();

      const senha = document.getElementById('senha-login-professor').value;

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

  // --- LÓGICA DE ALUGAR LIVRO ---
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
      console.error('Erro ao conectar para alugar:', error);
      alert('Falha ao conectar com o servidor.');
    }
  };

  // --- LÓGICA DE EXCLUIR LIVRO (ADMIN) ---
  window.deletarLivro = async function (id) {
    const usuario = getUsuarioSessao();
    if (!usuario || usuario.tipo !== 'admin') {
      alert('Apenas o Administrador tem permissão para excluir livros.');
      return;
    }

    const confirmacao = confirm('Tem certeza que deseja excluir este livro?');
    if (!confirmacao) return;

    try {
      const resposta = await fetch(`${API_URL}/livros/${id}`, {
        method: 'DELETE'
      });

      if (resposta.ok) {
        alert('Livro excluído com sucesso!');
        const cartaoLivro = document.querySelector(`.livro[data-id="${id}"]`);
        if (cartaoLivro) cartaoLivro.remove();
      } else {
        const erro = await resposta.json();
        alert(`Erro ao excluir: ${erro.erro}`);
      }
    } catch (error) {
      console.error('Erro ao conectar para excluir:', error);
      alert('Falha ao conectar com o servidor.');
    }
  };

  // --- PRÉVIA DA CAPA (PÁGINA DE CADASTRO DE LIVROS) ---
  const campoCapa = document.getElementById('capa');
  const previaCapa = document.getElementById('previa-capa');
  const imagemCapa = document.getElementById('imagem-capa');
  const nomeCapa = document.getElementById('nome-capa');
  const botaoRemoverCapa = document.getElementById('remover-capa');

  if (campoCapa && previaCapa && imagemCapa && nomeCapa && botaoRemoverCapa) {
    campoCapa.addEventListener('change', () => {
      const arquivo = campoCapa.files[0];
      if (!arquivo) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        imagemCapa.src = e.target.result;
        nomeCapa.textContent = arquivo.name;
        previaCapa.hidden = false;
      };
      reader.readAsDataURL(arquivo);
    });

    botaoRemoverCapa.addEventListener('click', () => {
      campoCapa.value = '';
      imagemCapa.removeAttribute('src');
      nomeCapa.textContent = '';
      previaCapa.hidden = true;
    });
  }

  // --- CADASTRO DE LIVRO (ADMIN - POST) ---
  const formCadastroLivro = document.querySelector('form label[for="title"]')?.closest('form');

  if (formCadastroLivro) {
    formCadastroLivro.addEventListener('submit', async (event) => {
      event.preventDefault();

      const usuario = getUsuarioSessao();
      if (!usuario || usuario.tipo !== 'admin') {
        alert('Apenas o Administrador tem permissão para cadastrar livros.');
        return;
      }

      let capaBase64 = null;
      const arquivoCapa = campoCapa?.files[0];

      if (arquivoCapa) {
        capaBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(arquivoCapa);
        });
      }

      const novoLivro = {
        titulo: document.getElementById('title').value,
        autor: document.getElementById('author').value,
        editora: document.getElementById('publisher')?.value || null,
        categoria: document.getElementById('genre')?.value || null,
        ano: parseInt(document.getElementById('year')?.value) || null,
        estoque: parseInt(document.getElementById('quantity')?.value) || 1,
        capa: capaBase64,
        descricao: document.getElementById('description')?.value || null
      };

      try {
        const resposta = await fetch(`${API_URL}/livros`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoLivro)
        });

        if (resposta.ok) {
          alert('Livro cadastrado com sucesso!');
          window.location.href = 'index.html';
        } else {
          const erro = await resposta.json();
          alert(`Erro no cadastro: ${erro.detalhe || erro.erro}`);
        }
      } catch (error) {
        console.error('Erro na conexão:', error);
        alert('Falha ao conectar com o servidor.');
      }
    });
  }

  // --- LISTAGEM E PESQUISA DE LIVROS ---
  const containerLivros = document.querySelector('.lista-livros');
  const inputBusca = document.getElementById('book-search');
  const botaoBusca = document.querySelector('.busca button');

  if (containerLivros) {
    let todosOsLivros = [];

    function renderizarLivros(lista) {
      if (lista.length === 0) {
        containerLivros.innerHTML = '<p>Nenhum livro encontrado.</p>';
        return;
      }

      const user = getUsuarioSessao();

      containerLivros.innerHTML = lista.map(livro => {
        const capaSrc = livro.capa ? livro.capa : 'https://via.placeholder.com/180x250?text=Sem+Capa';
        const disponivel = livro.estoque > 0;

        return `
          <article class="livro" data-id="${livro.id}">
            <img src="${capaSrc}" alt="Capa de ${livro.titulo}" class="capa-livro" />
            <h3 class="titulo-livro">${livro.titulo}</h3>
            <p class="detalhes-livro"><strong>Autor:</strong> ${livro.autor}</p>
            ${livro.categoria ? `<p class="detalhes-livro"><strong>Categoria:</strong> ${livro.categoria}</p>` : ''}
            ${livro.editora ? `<p class="detalhes-livro"><strong>Editora:</strong> ${livro.editora}</p>` : ''}
            ${livro.ano ? `<p class="detalhes-livro"><strong>Ano:</strong> ${livro.ano}</p>` : ''}
            <p class="detalhes-livro"><strong>Exemplares:</strong> ${livro.estoque}</p>
            ${livro.descricao ? `<p class="descricao-rodape">${livro.descricao}</p>` : ''}
            
            <div style="margin-top: auto; padding-top: 10px; display: flex; gap: 8px; flex-direction: column;">
              ${disponivel
            ? `<button class="botao-principal" onclick="alugarLivro(${livro.id})">Alugar livro</button>`
            : `<button class="botao-principal" disabled style="background-color: #9ca3af; cursor: not-allowed;">Indisponível</button>`
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

    function filtrarLivros() {
      if (!inputBusca) return;
      const termo = inputBusca.value.toLowerCase().trim();

      const resultados = todosOsLivros.filter(livro => {
        const titulo = livro.titulo ? livro.titulo.toLowerCase() : '';
        const autor = livro.autor ? livro.autor.toLowerCase() : '';
        const categoria = livro.categoria ? livro.categoria.toLowerCase() : '';

        return titulo.includes(termo) || autor.includes(termo) || categoria.includes(termo);
      });

      renderizarLivros(resultados);
    }

    async function carregarLivros() {
      try {
        const resposta = await fetch(`${API_URL}/livros`);
        if (!resposta.ok) throw new Error('Erro ao buscar livros');

        todosOsLivros = await resposta.json();
        renderizarLivros(todosOsLivros);
      } catch (erro) {
        console.error('Erro ao carregar livros:', erro);
        containerLivros.innerHTML = '<p>Erro ao conectar com a base de dados.</p>';
      }
    }

    if (inputBusca) inputBusca.addEventListener('input', filtrarLivros);
    if (botaoBusca) {
      botaoBusca.addEventListener('click', (e) => {
        e.preventDefault();
        filtrarLivros();
      });
    }

    carregarLivros();
  }
});

function criarCartaoLivro(livro) {
  // Se estiver alugado, o botão fica desativado e com o texto "Alugado"
  const botaoHTML = livro.alugado
    ? `<button class="botao-principal botao-desativado" disabled>Alugado</button>`
    : `<button class="botao-principal" onclick="alugarLivro(${livro.id}, this)">Alugar</button>`;

  return `
    <div class="livro" data-id="${livro.id}">
      <img src="${livro.capa || 'placeholder.jpg'}" alt="${livro.titulo}" class="capa-livro">
      <h3 class="titulo-livro">${livro.titulo}</h3>
      <p class="detalhes-livro">Autor: ${livro.autor}</p>
      ${botaoHTML}
    </div>
  `;
}