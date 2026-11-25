# Testes Automatizados — API Biblioteca

## 1. Sobre o projeto

Este projeto foi desenvolvido como atividade prática de automação de testes utilizando Playwright e TypeScript.

O objetivo é aplicar testes automatizados em um sistema de biblioteca, utilizando requisições à API e interações com a interface da aplicação.

A atividade também aborda o conceito de **teardown**, responsável por realizar a limpeza dos dados criados durante os testes, garantindo que uma execução não interfira nas seguintes.

## 2. Tecnologias utilizadas

- **Playwright:** framework de automação de testes.
- **TypeScript:** linguagem utilizada para desenvolver os testes.
- **Node.js:** ambiente de execução.
- **API REST:** comunicação com os recursos do sistema de biblioteca.

## 3. Estrutura do projeto

```text
tests/
├── e2e/
│   └── listarEmprestimo.spec.ts
│
└── Support/
    ├── api-helpers.ts
    └── dados.ts
```

### Descrição dos arquivos

- `listarEmprestimo.spec.ts`: contém o teste automatizado de listagem de livros.
- `api-helpers.ts`: reúne funções auxiliares para autenticação, cadastro, consulta e exclusão de livros e empréstimos.
- `dados.ts`: centraliza os dados utilizados nos testes, como usuários e informações dos livros.

## 4. Primeira missão — Listagem de livros e teardown

### Objetivo

Criar um teste que cadastra um livro pela API, verifica se ele aparece corretamente na listagem da aplicação e realiza a limpeza dos dados após a execução.

### Etapas implementadas

1. Autenticação do administrador pela API.
2. Cadastro de um livro pela API utilizando a função `criarlivro()`.
3. Armazenamento do ID do livro criado.
4. Autenticação do leitor no navegador utilizando `loginNoNavegador()`.
5. Acesso à página de listagem de livros.
6. Verificação da presença do livro na listagem.
7. Validação do título, autor e disponibilidade.
8. Exclusão do livro ao final da execução utilizando `afterEach()`.

### Validações realizadas

| Elemento | Resultado esperado |
|---|---|
| Linha do livro | Visível |
| Título | Livro do Teste |
| Autor | Autora Inventada |
| Disponibilidade | Disponível |

## 5. Implementação do teardown

Inicialmente, o teste criava um livro pela API, mas não realizava sua exclusão após a execução.

Isso provocava o acúmulo de registros na base de dados e poderia causar conflitos nas execuções seguintes.

Para resolver esse problema, foi implementado o `afterEach`, utilizando a função `apagarlivro()` já disponível no arquivo `api-helpers.ts`.

```ts
test.afterEach(async ({ request }) => {
  if (livro !== undefined) {
    await apagarlivro(request, tokenAdmin, livro);
  }
});
```

### Como funciona?

- `afterEach`: executa após cada teste.
- `livro !== undefined`: verifica se o livro recebeu um ID válido.
- `apagarlivro()`: realiza a exclusão do livro pela API.

Dessa forma, o livro criado durante o teste é removido ao final da execução.

## 6. Problemas identificados e correções

Durante a implementação, foram encontrados problemas relacionados à geração dos dados de teste.

### Problema 001 — ISBN duplicado (409 Conflict)

Na primeira execução, a API retornou o status HTTP `409`.

**Mensagem retornada:**

```json
{
  "erro": "ISBN já cadastrado",
  "status": 409
}
```

**Causa:** o ISBN utilizado inicialmente era fixo (`9780000000001`) e já pertencia a outro livro cadastrado na API.

**Correção:** foi modificada a função `novolivro()` para gerar um ISBN variável a cada execução.

### Problema 002 — ISBN com quantidade inválida de dígitos (422 Unprocessable Entity)

Após a primeira alteração, a API retornou o status HTTP `422`.

**Mensagem retornada:**

```text
O campo 'isbn' deve conter 10 ou 13 dígitos numéricos, sem traços.
```

**Causa:** o ISBN gerado ultrapassava a quantidade permitida de dígitos.

**Correção:** a geração foi ajustada para produzir exatamente 13 dígitos numéricos.

Implementação utilizada:

```ts
export function novolivro(quantidade: number) {
  const isbn = `978${Date.now().toString().slice(-10)}`;

  return {
    titulo: 'Livro do Teste',
    autor: 'Autora Inventada',
    isbn,
    anoPublicacao: 2020,
    quantidade,
  };
}
```

Essa implementação utiliza `Date.now()` para gerar um valor variável e `slice(-10)` para selecionar os últimos dez dígitos, acrescentando o prefixo `978`.

## 7. Execução dos testes

Para executar o teste individualmente:

```bash
npx playwright test tests/e2e/listarEmprestimo.spec.ts --project=e2e
```

Para executar o mesmo teste duas vezes:

```bash
npx playwright test tests/e2e/listarEmprestimo.spec.ts --project=e2e --repeat-each=2
```

O parâmetro `--repeat-each=2` permite verificar o comportamento do teste em duas execuções.

## 8. Resultados obtidos

Após as correções, o teste apresentou os seguintes resultados:

### Primeira execução

```text
Status: 201
Resposta: Livro criado com sucesso.
1 passed (1.1s)
```

### Duas execuções consecutivas

```text
Running 2 tests using 2 workers

Livro criado com ID 8
Livro criado com ID 9

2 passed (859ms)
```

<escape>**Resultado:**</escape> as duas execuções foram aprovadas, demonstrando que o teste consegue criar os registros, realizar as validações e executar a limpeza sem provocar conflitos entre as execuções.

## 9. Importância dos testes e do teardown

Os testes automatizados permitem verificar se as funcionalidades do sistema estão funcionando conforme o esperado, reduzindo a necessidade de validações manuais repetitivas.

O teardown é importante porque remove os dados criados durante os testes, evitando:

- Acúmulo de registros na base de dados.
- Conflitos entre execuções.
- Falhas causadas por dados duplicados.
- Dependência entre testes.
- Resultados inconsistentes.

A utilização do `afterEach` contribui para a independência e a confiabilidade da suíte de testes.

## 10. Segunda missão — Empréstimo de livros pela interface

**Status: Em desenvolvimento.**

### Objetivo

Criar um novo teste E2E que permita ao leitor realizar o empréstimo de um livro pela interface da aplicação.

### Etapas previstas

1. Criar um livro pela API.
2. Autenticar o leitor no navegador.
3. Acessar a tela de detalhes do livro.
4. Clicar no botão de emprestar.
5. Validar a mensagem de sucesso.
6. Verificar se o livro aparece como indisponível.
7. Localizar o empréstimo ativo pela API utilizando o ID do livro.
8. Excluir o empréstimo.
9. Excluir o livro.

**Atenção à ordem do teardown:** primeiro deve ser excluído o empréstimo e, em seguida, o livro, pois existe uma relação entre esses registros.

---

## 11. Conclusão

A primeira missão permitiu praticar a integração entre API e interface, a criação de dados para testes automatizados, a validação de funcionalidades e a implementação de teardown.

Também foi possível identificar e corrigir problemas relacionados à duplicidade e à validação dos dados enviados à API.

A execução repetida do teste, com duas aprovações consecutivas, demonstrou a importância da limpeza dos dados para manter a independência e a confiabilidade dos testes automatizados.