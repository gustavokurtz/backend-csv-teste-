# API de Processamento de Arquivos CSV

Este projeto é uma API REST desenvolvida com NestJS para processamento de arquivos CSV com integração ao Amazon S3 e um microserviço Python para processamento de dados.

## Visão Geral da Aplicação

A aplicação consiste em uma API que permite:
- Upload de arquivos CSV
- Processamento automático dos dados através de um microserviço Python
- Armazenamento dos arquivos processados no Amazon S3
- Gerenciamento dos arquivos (listagem, exclusão, atualização de metadados)
- Visualização prévia dos dados processados

## Tecnologias Utilizadas

- **NestJS**: Framework back-end para Node.js, escolhido pela robustez, modularidade e arquitetura baseada em decoradores
- **Prisma ORM**: ORM moderno para TypeScript, utilizado para modelagem e acesso ao banco de dados PostgreSQL
- **AWS S3**: Serviço de armazenamento em nuvem para os arquivos processados
- **Swagger**: Documentação automatizada da API
- **Jest**: Framework para testes unitários e de integração
- **PapaParse**: Biblioteca para processamento de arquivos CSV no JavaScript
- **Axios**: Cliente HTTP para comunicação com microserviço Python

## Estrutura do Projeto

O projeto segue a arquitetura modular do NestJS:

- **src/csv-files**: Módulo principal para gerenciamento de arquivos CSV
- **src/prisma**: Módulo para conexão e gestão do banco de dados
- **src/s3**: Módulo para integração com Amazon S3
- **src/app**: Módulo principal da aplicação

## Detalhes sobre Decisões Técnicas

### 1. Integração com S3 (src/s3/s3.service.ts)
A implementação utiliza o SDK AWS v3 para Node.js que oferece maior modularidade e eficiência. O serviço S3 foi configurado para:
- Gerar URLs pré-assinadas com expiração de 7 dias, permitindo acesso temporário aos arquivos sem expor credenciais AWS
- Implementar upload via streaming com `Upload` do lib-storage, evitando carregamento total do arquivo na memória
- Adicionar prefixo "csv-files/" para organizar os arquivos no bucket S3

### 2. Processamento de Arquivos (src/csv-files/csv-files.service.ts)
O processamento é feito em várias etapas:
- Armazenamento temporário usando os diretórios do sistema operacional (`os.tmpdir()`)
- Comunicação com o serviço Python via FormData, permitindo envio eficiente de arquivos
- Limpeza de arquivos temporários após processamento usando `fs.unlinkSync`
- Tratamento estruturado de erros com atualização do status no banco de dados

### 3. Banco de Dados com Prisma (prisma/schema.prisma)
O modelo de dados foi estruturado com campos específicos:
- `status` para acompanhar o ciclo de vida do arquivo (PROCESSING, COMPLETED, ERROR)
- `s3Url` para armazenar a URL pré-assinada
- Timestamps automáticos (`createdAt`, `updatedAt`) para auditoria
- `error` para registro detalhado em caso de falhas

## Como Executar

### Pré-requisitos
- Node.js (v18+)
- PostgreSQL
- Microserviço Python para processamento de CSV (clone de https://github.com/gustavokurtz/backend-csv-teste.git)
- Conta AWS com acesso ao S3 (ou emulador local)

### Passos para Execução

1. Clone o repositório:
```bash
git clone https://github.com/gustavokurtz/backend-csv-teste-.git
cd backend-csv-teste-
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto:
```
DATABASE_URL="postgresql://user:password@localhost:5432/csv_processor"
AWS_ACCESS_KEY_ID=sua_key_id
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=seu_bucket
PYTHON_API_URL=http://localhost:8000
```

4. Execute as migrations do Prisma e gere o cliente Prisma:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Clone e execute o microserviço Python de processamento:
```bash
git clone https://github.com/gustavokurtz/backend-csv-teste.git
cd backend-csv-teste
# Siga as instruções do README do repositório para configurar e executar
```

6. Inicie o servidor de desenvolvimento:
```bash
npm run start:dev
```

7. Acesse a documentação Swagger em http://localhost:3000/api

## Testes

Execute os testes unitários com:
```bash
npm run test
```

## Documentação da API

A documentação completa da API está disponível via Swagger UI em `/api` quando o servidor está em execução.
