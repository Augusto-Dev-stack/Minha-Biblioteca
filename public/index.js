document.addEventListener('DOMContentLoaded', () => {
    carregarLivros();
});

async function carregarLivros() {
    const listaLivros = document.querySelector('.lista-livros');

    try {
        const resposta = await fetch('http://127.0.0.1:3000/api/livros');
        if (!resposta.ok) throw new Error('Falha ao procurar dados');

        const livros = await resposta.json();
        listaLivros.innerHTML = ''; // Limpa o conteúdo estático/antigo

        if (livros.length === 0) {
            listaLivros.innerHTML = '<p>Nenhum livro cadastrado no momento.</p>';
            return;
        }

        livros.forEach(livro => {
            const article = document.createElement('article');
            article.className = 'livro';

            // Tratamento do caminho da capa
            let srcCapa = 'https://via.placeholder.com/180x250?text=Sem+Capa';
            if (livro.capa) {
                if (livro.capa.startsWith('http') || livro.capa.startsWith('data:')) {
                    srcCapa = livro.capa;
                } else {
                    srcCapa = `http://127.0.0.1:3000/uploads/${livro.capa}`;
                }
            }

            article.innerHTML = `
        <img src="${srcCapa}" alt="Capa de ${livro.titulo}" class="capa-livro" />
        <h3 class="titulo-livro">${livro.titulo}</h3>
        <p class="detalhes-livro">${livro.autor} · ${livro.categoria || 'Geral'}</p>
      `;

            listaLivros.appendChild(article);
        });
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        listaLivros.innerHTML = '<p>Erro ao carregar os livros. Verifique se o servidor está ativo.</p>';
    }
}