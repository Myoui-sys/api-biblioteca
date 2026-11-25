
import { test, expect } from '@playwright/test';

import {
  login,
  loginNoNavegador,
  criarlivro,
  apagarlivro,
  buscaremprestimoativo,
  apagaremprestimo,
} from '../Support/api-helpers';

import { admin, leitor, novolivro } from '../Support/dados';

test.use({ baseURL: 'http://localhost:3000' });

let tokenAdmin: string;
let livro: number | undefined;

test.beforeEach(async ({ request, page }) => {
  // Login do administrador pela API
  tokenAdmin = await login(request, admin.email, admin.senha);

  // Cria um livro com apenas um exemplar
  livro = await criarlivro(request, tokenAdmin, novolivro(1));

  console.log(`Livro criado: ID ${livro}`);

  // Login do leitor no navegador
  await loginNoNavegador(
    page,
    request,
    leitor.email,
    leitor.senha
  );
});

test('leitor consegue emprestar um livro pela interface', async ({
  page,
  request,
}) => {
  await page.goto(`/livros/${livro}`);

  await expect(
    page.getByTestId('livro-disponibilidade')
  ).toHaveText('Disponível');

  await page.getByTestId('botao-emprestar').click();

  await expect(
    page.getByTestId('mensagem-sucesso')
  ).toHaveText('Empréstimo realizado com sucesso');

  await expect(
    page.getByTestId('livro-disponibilidade')
  ).toHaveText('Indisponível');

  await expect(
    page.getByTestId('livro-quantidade-disponivel')
  ).toHaveText('0 de 1');

  // Confirma pela API que o empréstimo foi criado
  const emprestimo = await buscaremprestimoativo(
    request,
    tokenAdmin,
    livro!
  );

  expect(emprestimo).toBeDefined();

  console.log(`Empréstimo criado: ID ${emprestimo}`);
});

test.afterEach(async ({ request }) => {
  if (livro !== undefined) {
    console.log('--- INÍCIO DO TEARDOWN ---');

    // Procura o empréstimo ativo
    const emprestimo = await buscaremprestimoativo(
      request,
      tokenAdmin,
      livro
    );

    if (emprestimo !== undefined) {
      console.log(`Empréstimo encontrado: ID ${emprestimo}`);

      // Exclui o empréstimo
      await apagaremprestimo(request, tokenAdmin, emprestimo);

      console.log('Empréstimo excluído com sucesso!');

      // Confirma que não existe mais empréstimo ativo
      const emprestimoRestante = await buscaremprestimoativo(
        request,
        tokenAdmin,
        livro
      );

      expect(emprestimoRestante).toBeUndefined();

      console.log('Verificação: nenhum empréstimo ativo encontrado.');
    } else {
      console.log('Nenhum empréstimo ativo encontrado para esse livro.');
    }

    // Exclui o livro
    await apagarlivro(request, tokenAdmin, livro);

    console.log(`Livro ID ${livro} excluído com sucesso!`);
    console.log('--- FIM DO TEARDOWN ---');
  }
});
