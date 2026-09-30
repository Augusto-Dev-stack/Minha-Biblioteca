document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://127.0.0.1:3030/livros';

  // --- LÓGICA DO CADASTRO (POST) ---
  const formCadastro = document.querySelector('form');

  if (formCadastro) {
    formCadastro.addEventListener('submit', async (event) => {
      event.preventDefault();

      const novoLivro = {
        titulo: document.getElementById('title').value,
        autor: document.getElementById('author').value,
        editora: document.getElementById('publisher')?.value || null,
        categoria: document.getElementById('genre')?.value || null,
        ano: parseInt(document.getElementById('year')?.value) || null,
        estoque: parseInt(document.getElementById('quantity')?.value) || 1,
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

  // --- LÓGICA DE LISTAGEM (GET) ---
  const containerLivros = document.querySelector('.lista-livros');

  if (containerLivros) {
    async function carregarLivros() {
      try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) throw new Error('Erro ao buscar livros');

        const livros = await resposta.json();

        if (livros.length === 0) {
          containerLivros.innerHTML = '<p>Nenhum livro cadastrado no momento.</p>';
          return;
        }

        containerLivros.innerHTML = livros.map(livro => `
          <article class="livro" data-id="${livro.id}">
            <h3 class="titulo-livro">${livro.titulo}</h3>
            <p class="detalhes-livro"><strong>Autor:</strong> ${livro.autor}</p>
            ${livro.categoria ? `<p class="detalhes-livro"><strong>Categoria:</strong> ${livro.categoria}</p>` : ''}
            ${livro.editora ? `<p class="detalhes-livro"><strong>Editora:</strong> ${livro.editora}</p>` : ''}
            ${livro.ano ? `<p class="detalhes-livro"><strong>Ano:</strong> ${livro.ano}</p>` : ''}
            <p class="detalhes-livro"><strong>Exemplares:</strong> ${livro.estoque || 1}</p>
            ${livro.descricao ? `<p class="descricao-rodape">${livro.descricao}</p>` : ''}
          </article>
        `).join('');

      } catch (erro) {
        console.error('Erro ao carregar livros:', erro);
        containerLivros.innerHTML = '<p>Erro ao conectar com a base de dados.</p>';
      }
    }

    carregarLivros();
  }
});