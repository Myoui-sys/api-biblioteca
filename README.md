# Automação de Testes — API Biblioteca

Projeto de automação de testes utilizando **Playwright e TypeScript**, com testes de API e testes End-to-End (E2E) em uma aplicação de gerenciamento de biblioteca.

O objetivo das atividades foi praticar autenticação, criação e exclusão de dados pela API, interação com a interface web, validação de funcionalidades e gerenciamento do ciclo de vida dos dados de teste.

## Tecnologias utilizadas

- **Playwright:** automação de testes de API e interface.
- **TypeScript:** linguagem utilizada na implementação dos testes.
- **Node.js:** ambiente de execução.
- **Git e GitHub:** versionamento e documentação do projeto.

## Estrutura do projeto

```text
biblioteca-testes/
├── .github/
│   └── workflows/
│       └── playwright.yml
├── tests/
│   ├── Support/
│   │   ├── api-helpers.ts
│   │   └── dados.ts
│   ├── api/
│   │   └── livros.spec.ts
│   └── e2e/
│       ├── listarEmprestimo.spec.ts
│       └── realizarEmprestimo.spec.ts
├── .gitignore
├── package.json
├── package-lock.json
├── playwright.config.ts
└── README.md
```

## Missão 1 — Teardown: exclusão de livro após o teste

### Objetivo

Garantir que o livro criado pela API durante a preparação do teste fosse excluído após sua execução, evitando o acúmulo de registros e problemas em execuções futuras.

### O que foi desenvolvido

1. Autenticação do administrador pela API.
2. Criação de um livro utilizando uma requisição POST.
3. Autenticação do leitor no navegador.
4. Acesso à listagem de livros.
5. Validação de que o livro criado estava visível na interface.
6. Implementação do `afterEach` para excluir o livro após o teste.

### Implementação do teardown

Foi utilizada a função `apagarlivro()` no `afterEach`:

```typescript
test.afterEach(async ({ request }) => {
  if (livro !== undefined) {
    await apagarlivro(request, tokenAdmin, livro);
  }
});
```

O `afterEach` é executado após cada teste, permitindo realizar a limpeza dos dados utilizados.

### Validações realizadas

- Livro criado com sucesso pela API.
- Livro identificado na listagem.
- Título, autor e disponibilidade validados.
- Exclusão do livro após a execução.

### Teste de repetição

O teste foi executado duas vezes consecutivas com o comando:

```bash
npx playwright test tests/e2e/listarEmprestimo.spec.ts --project=e2e --repeat-each=2
```

**Resultado obtido:**

```text
Running 2 tests using 2 workers

Status: 201
Resposta: {"id":8,...}

Status: 201
Resposta: {"id":9,...}

2 passed (859ms)
```

A execução demonstrou que foi possível criar e excluir registros em execuções repetidas, sem conflito de ISBN.

Para evitar duplicidade, foi utilizado um ISBN dinâmico na função `novolivro()`.

---

## Missão 2 — Teardown: exclusão de empréstimo e livro

### Objetivo

Automatizar o fluxo de realização de um empréstimo pela interface e garantir que os dados criados durante o teste fossem removidos corretamente.

Nesta atividade, o teste deveria realizar uma operação pela interface, consultar o resultado pela API e limpar os registros criados.

### Fluxo do teste

1. Autenticação do administrador pela API.
2. Criação de um livro com apenas um exemplar disponível.
3. Autenticação do leitor no navegador.
4. Acesso à página de detalhes do livro.
5. Verificação da disponibilidade inicial.
6. Realização do empréstimo pela interface.
7. Validação da mensagem de sucesso.
8. Verificação de que o livro ficou indisponível.
9. Consulta à API para localizar o empréstimo ativo.
10. Exclusão do empréstimo.
11. Exclusão do livro.

### Validações realizadas

- O livro iniciou com status disponível.
- O leitor conseguiu realizar o empréstimo.
- A mensagem de sucesso foi apresentada.
- A quantidade disponível foi atualizada para zero.
- O livro passou para o status indisponível.
- O empréstimo foi registrado na API.

### Implementação do teardown

Para localizar o empréstimo, foi utilizada a função `buscaremprestimoativo()`, que consulta os empréstimos ativos e procura aquele associado ao ID do livro.

A limpeza foi implementada no `afterEach`:

```typescript
test.afterEach(async ({ request }) => {
  if (livro !== undefined) {
    const emprestimo = await buscaremprestimoativo(
      request,
      tokenAdmin,
      livro
    );

    if (emprestimo !== undefined) {
      await apagaremprestimo(
        request,
        tokenAdmin,
        emprestimo
      );

      const emprestimoRestante = await buscaremprestimoativo(
        request,
        tokenAdmin,
        livro
      );

      expect(emprestimoRestante).toBeUndefined();
    }

    await apagarlivro(request, tokenAdmin, livro);
  }
});
```

### Por que excluir o empréstimo antes do livro?

O empréstimo está relacionado ao livro. Por isso, a exclusão deve respeitar a dependência entre os registros.

A ordem utilizada foi:

1. Localizar o empréstimo ativo.
2. Excluir o empréstimo.
3. Consultar novamente a API para confirmar a exclusão.
4. Excluir o livro.

Essa sequência evita deixar registros relacionados inconsistentes.

### Evidência da execução

Comando utilizado:

```bash
npx playwright test tests/e2e/realizarEmprestimo.spec.ts --project=e2e
```

Resultado obtido:

```text
Running 1 test using 1 worker

Status: 201
Livro criado: ID 12
Empréstimo criado: ID 3

--- INÍCIO DO TEARDOWN ---
Empréstimo encontrado: ID 3
Empréstimo excluído com sucesso!
Verificação: nenhum empréstimo ativo encontrado.
Livro ID 12 excluído com sucesso!
--- FIM DO TEARDOWN ---

1 passed (1.0s)
```

O resultado confirmou que o empréstimo foi excluído, que não havia mais empréstimo ativo associado ao livro e que o livro também foi removido.

---

## Funções auxiliares desenvolvidas

O arquivo `tests/Support/api-helpers.ts` concentra funções reutilizáveis para facilitar a implementação dos testes.

| Função | Responsabilidade |
|---|---|
| `login()` | Realiza autenticação pela API e retorna o token. |
| `loginNoNavegador()` | Autentica o usuário e configura o navegador. |
| `criarlivro()` | Cria um livro pela API e retorna seu ID. |
| `apagarlivro()` | Exclui um livro pela API. |
| `buscaremprestimoativo()` | Localiza um empréstimo ativo pelo ID do livro. |
| `apagaremprestimo()` | Exclui um empréstimo pela API. |

O arquivo `tests/Support/dados.ts` concentra os dados utilizados nos testes, como credenciais de administrador e leitor e a função de geração de livros com ISBN dinâmico.

## Conceitos praticados

- Testes automatizados de API.
- Testes End-to-End (E2E).
- Autenticação e autorização por token.
- Requisições HTTP: GET, POST e DELETE.
- Integração entre API e interface web.
- Fixtures e hooks do Playwright.
- `beforeEach` e `afterEach`.
- Setup e teardown.
- Validação de respostas e status HTTP.
- Gerenciamento de dados de teste.
- Reutilização de funções auxiliares.
- Execução repetida de testes.

## Resultados alcançados

| Atividade | Resultado |
|---|---|
| Missão 1 — Listagem e exclusão de livro | 2 execuções aprovadas |
| Missão 2 — Realização de empréstimo e limpeza | 1 execução aprovada |

**Total: 3 execuções de teste aprovadas nas evidências registradas.**

## Considerações finais

As atividades permitiram praticar a automação de testes em diferentes camadas da aplicação, combinando requisições à API com interações realizadas no navegador.

Um dos principais aprendizados foi compreender a importância do setup e teardown para manter os testes independentes, organizados e repetíveis.

Também foi possível aplicar a consulta à API para validar operações realizadas pela interface e garantir que os dados temporários fossem removidos ao final de cada execução.

**Projeto desenvolvido para fins de estudo e prática em Qualidade de Software (QA), utilizando Playwright e TypeScript.**