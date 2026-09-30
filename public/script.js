document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://127.0.0.1:3030/livros';

  // --- LÓGICA DE DELETAR LIVRO ---
  window.deletarLivro = async function (id) {
    const confirmacao = confirm('Tem certeza que deseja excluir este livro?');
    if (!confirmacao) return;

    try {
      const resposta = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      if (resposta.ok) {
        alert('Livro excluído com sucesso!');
        const cartaoLivro = document.querySelector(`.livro[data-id="${id}"]`);
        if (cartaoLivro) {
          cartaoLivro.remove();
        }
      } else {
        const erro = await resposta.json();
        alert(`Erro ao excluir: ${erro.erro}`);
      }
    } catch (error) {
      console.error('Erro ao conectar para excluir:', error);
      alert('Falha ao conectar com o backend na porta 3030.');
    }
  };

  // --- LÓGICA DE PRÉVIA DA CAPA (PÁGINA DE CADASTRO) ---
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

  // --- LÓGICA DO CADASTRO (POST) ---
  const formCadastro = document.querySelector('form');

  if (formCadastro) {
    formCadastro.addEventListener('submit', async (event) => {
      event.preventDefault();

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
        const resposta = await fetch(API_URL, {
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
        alert('Falha ao conectar com o backend na porta 3030.');
      }
    });
  }

  // --- LÓGICA DE LISTAGEM E PESQUISA EM TEMPO REAL (GET + FILTER) ---
  const containerLivros = document.querySelector('.lista-livros');
  const inputBusca = document.getElementById('book-search');
  const botaoBusca = document.querySelector('.busca button');

  if (containerLivros) {
    let todosOsLivros = [];

    // Desenha os livros na página
    function renderizarLivros(lista) {
      if (lista.length === 0) {
        containerLivros.innerHTML = '<p>Nenhum livro encontrado.</p>';
        return;
      }

      containerLivros.innerHTML = lista.map(livro => {
        const capaSrc = livro.capa ? livro.capa : 'https://via.placeholder.com/180x250?text=Sem+Capa';

        return `
          <article class="livro" data-id="${livro.id}">
            <img src="${capaSrc}" alt="Capa de ${livro.titulo}" class="capa-livro" />
            <h3 class="titulo-livro">${livro.titulo}</h3>
            <p class="detalhes-livro"><strong>Autor:</strong> ${livro.autor}</p>
            ${livro.categoria ? `<p class="detalhes-livro"><strong>Categoria:</strong> ${livro.categoria}</p>` : ''}
            ${livro.editora ? `<p class="detalhes-livro"><strong>Editora:</strong> ${livro.editora}</p>` : ''}
            ${livro.ano ? `<p class="detalhes-livro"><strong>Ano:</strong> ${livro.ano}</p>` : ''}
            <p class="detalhes-livro"><strong>Exemplares:</strong> ${livro.estoque || 1}</p>
            ${livro.descricao ? `<p class="descricao-rodape">${livro.descricao}</p>` : ''}
            
            <button class="botao-excluir" onclick="deletarLivro(${livro.id})">Excluir</button>
          </article>
        `;
      }).join('');
    }

    // Filtra no frontend por Título, Autor ou Categoria
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

    // Busca do banco via backend
    async function carregarLivros() {
      try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) throw new Error('Erro ao buscar livros');

        todosOsLivros = await resposta.json();
        renderizarLivros(todosOsLivros);

      } catch (erro) {
        console.error('Erro ao carregar livros:', erro);
        containerLivros.innerHTML = '<p>Erro ao conectar com a base de dados.</p>';
      }
    }

    // Eventos da barra de pesquisa
    if (inputBusca) {
      inputBusca.addEventListener('input', filtrarLivros);
    }

    if (botaoBusca) {
      botaoBusca.addEventListener('click', (e) => {
        e.preventDefault();
        filtrarLivros();
      });
    }

    carregarLivros();
  }
});