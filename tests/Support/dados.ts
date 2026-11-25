// Usuários que já existem no seed da biblioteca
export const admin = {
  email: 'admin@biblioteca.com',
  senha: 'Admin@123',
};

export const leitor = {
  email: 'leitor@biblioteca.com',
  senha: 'Leitor@123',
};

// Monta os dados de um livro para os testes
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