# Usar imagem base Node.js
FROM node:latest

# Definir diretório de trabalho
WORKDIR /usr/src/app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante dos arquivos
COPY . .

# Expor a porta da API
EXPOSE 3000

# Comando para iniciar a API
CMD ["npm", "run", "start:prod"]
