# Usar imagem base Node.js
FROM node:latest

# Definir diretório de trabalho
WORKDIR /usr/src/app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar todos os arquivos do projeto
COPY . .

# Gerar a build do NestJS
RUN npm run build

# Expor a porta da API
EXPOSE 3000

# Comando para iniciar a API em produção
CMD ["node", "dist/main"]
